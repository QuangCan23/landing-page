import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Initialize client only if URL is provided to avoid crash
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Register user before payment (Stores in Supabase)
  app.post("/api/register", async (req, res) => {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    const { name, email, phone, package: pkg, paymentCode } = req.body;
    
    if (!email || !paymentCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Save registration data to Supabase 'registrations' table
      const { error } = await supabase
        .from("registrations")
        .upsert({ 
          payment_code: paymentCode.trim(), 
          email, 
          name, 
          package: pkg,
          phone,
          status: "pending",
          created_at: new Date().toISOString()
        }, { onConflict: "payment_code" });

      if (error) throw error;
      
      console.log(`[Registration] Saved to Supabase: ${paymentCode} for ${email}`);
      res.json({ status: "ok" });
    } catch (error) {
      console.error("[Supabase] Error saving registration:", error);
      res.status(500).json({ error: "Failed to save registration" });
    }
  });

  // API: SePay Webhook (Real-time)
  app.post("/api/sepay-webhook", async (req, res) => {
    const webhookData = req.body;
    const webhookKey = req.headers["x-sepay-webhook-key"];

    // Kiểm tra mã bảo mật Webhook nếu có cấu hình
    if (process.env.SEPAY_WEBHOOK_KEY && webhookKey !== process.env.SEPAY_WEBHOOK_KEY) {
      console.warn("[Webhook] Unauthorized webhook attempt");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { content, amount } = webhookData;
    console.log(`[Webhook] Received payment: ${amount}. Content: ${content}`);

    if (!supabase) {
      console.error("[Webhook] Supabase not configured");
      return res.status(500).json({ error: "Supabase not configured" });
    }

    try {
      // 1. Tìm registration trong Supabase
      const { data: registration, error: regError } = await supabase
        .from("registrations")
        .select("*")
        .eq("status", "pending");

      if (registration && !regError) {
        const matched = registration.find(r => content.includes(r.payment_code));
        
        if (matched) {
          console.log(`[Webhook] Match found! Creating account for ${matched.email}`);
          
          // 2. TẠO TÀI KHOẢN TRÊN SUPABASE AUTH
          // Mật khẩu là số điện thoại, Role là gói học
          const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
            email: matched.email,
            password: matched.phone,
            email_confirm: true,
            user_metadata: { 
              full_name: matched.name,
              role: matched.package 
            }
          });

          if (!authError) {
            // 3. Cập nhật trạng thái trong bảng registrations
            await supabase
              .from("registrations")
              .update({ 
                status: "completed", 
                paid_at: new Date().toISOString(), 
                paid_amount: amount 
              })
              .eq("payment_code", matched.payment_code);
              
            console.log(`[Webhook] Successfully created account and updated DB for ${matched.email}`);
          } else {
            console.error("[Webhook] Auth Error:", authError.message);
          }
        }
      }
    } catch (error) {
      console.error("[Webhook] Error processing:", error);
    }

    res.json({ status: "ok" });
  });

  // SePay API Polling Logic (Backup)
  async function pollSePayTransactions() {
    if (!supabase) return;
    const apiKey = process.env.VITE_SEPAY_API_KEY;
    if (!apiKey) return;

    try {
      const response = await fetch("https://my.sepay.vn/userapi/transactions/list", {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data: any = await response.json();
        const transactions = data.transactions || [];

        for (const tx of transactions) {
          const content = tx.transaction_content || "";
          
          const { data: reg, error } = await supabase
            .from("registrations")
            .select("*")
            .eq("status", "pending")
            .filter("payment_code", "in", `(${content})`)
            .maybeSingle();

          if (reg && !error) {
            // TỰ ĐỘNG TẠO TÀI KHOẢN (Giống Webhook)
            const { error: authError } = await supabase.auth.admin.createUser({
              email: reg.email,
              password: reg.phone,
              email_confirm: true,
              user_metadata: { full_name: reg.name, role: reg.package }
            });

            if (!authError) {
              await supabase
                .from("registrations")
                .update({ status: "completed", paid_at: new Date().toISOString(), paid_amount: tx.amount })
                .eq("payment_code", reg.payment_code);
              console.log(`[Polling] Created account for ${reg.email}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("[Polling] Error:", error);
    }
  }

  // Start polling every 60 seconds
  setInterval(pollSePayTransactions, 60000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
