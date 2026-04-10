/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from "@supabase/supabase-js";
import confetti from 'canvas-confetti';

// Supabase Client Initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Initialize client only if URL is provided to avoid crash
const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function App() {
  const [showDetails, setShowDetails] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // Realtime Listener for Payment Success
  useEffect(() => {
    if (!showQR || !paymentCode || !supabase) return;

    console.log("🔔 Đang lắng nghe thanh toán cho mã:", paymentCode);

    const normalizeCode = (code: string) => code.replace(/\s+/g, '').toUpperCase();
    const targetCode = normalizeCode(paymentCode);

    // Kiểm tra trạng thái hiện tại ngay khi mở QR (phòng trường hợp đã thanh toán trước đó)
    const checkInitialStatus = async () => {
      try {
        console.log("🔍 Kiểm tra trạng thái ban đầu cho mã:", paymentCode);
        const { data, error } = await supabase
          .from('registrations')
          .select('status, payment_code')
          .eq('status', 'completed'); // Lấy tất cả completed để so khớp linh hoạt hơn hoặc dùng filter
        
        if (error) throw error;

        const found = data?.find(reg => normalizeCode(reg.payment_code) === targetCode);
        
        if (found) {
          console.log("✅ Đã phát hiện trạng thái hoàn tất từ trước!");
          handleSuccess();
        }
      } catch (err) {
        console.error("❌ Lỗi khi kiểm tra trạng thái ban đầu:", err);
      }
    };

    const handleSuccess = () => {
      console.log("🎉 Kích hoạt hiệu ứng thành công!");
      setIsPaidSuccess(true);
      // Bắn pháo hoa ăn mừng
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#ffd700', '#ff0000']
      });
    };

    checkInitialStatus();

    const channel = supabase
      .channel(`payment-${targetCode}`) // Dùng channel riêng cho mã này
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'registrations',
        },
        (payload: any) => {
          console.log("📝 Realtime payload nhận được:", payload);
          
          const newData = payload.new;
          if (!newData) return;

          const dbCode = normalizeCode(newData.payment_code || "");
          
          console.log(`🧐 So khớp: DB[${dbCode}] vs Current[${targetCode}] | Status: ${newData.status}`);

          if (
            dbCode === targetCode && 
            newData.status === 'completed'
          ) {
            console.log("✅ Khớp mã! Hiển thị thành công.");
            handleSuccess();
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Trạng thái kết nối Realtime:", status);
        if (status === 'CHANNEL_ERROR') {
          console.error("❌ Lỗi kết nối Realtime. Có thể bảng registrations chưa bật Realtime Replication.");
        }
      });

    return () => {
      console.log("🔌 Ngắt kết nối Realtime cho mã:", paymentCode);
      supabase.removeChannel(channel);
    };
  }, [showQR, paymentCode]);
  
  // SePay Configuration
  const [sepayConfig, setSepayConfig] = useState(() => {
    const meta = import.meta as any;
    const saved = localStorage.getItem('sepay_config');
    const savedConfig = saved ? JSON.parse(saved) : {};
    
    // TRUY XUẤT TRỰC TIẾP TỪ SECRETS (Environment Variables)
    const envApiKey = meta.env?.VITE_SEPAY_API_KEY;
    const envBankName = meta.env?.VITE_BANK_NAME;
    const envBankId = meta.env?.VITE_BANK_ID;
    const envAccount = meta.env?.VITE_BANK_ACCOUNT;
    const envAccountName = meta.env?.VITE_ACCOUNT_NAME;

    return {
      apiKey: envApiKey || savedConfig.apiKey || '',
      // SePay dùng chung 1 URL chuẩn này, không cần người dùng phải tìm
      apiUrl: 'https://my.sepay.vn/userapi', 
      bank: envBankName || savedConfig.bank || 'MB',
      bankId: envBankId || savedConfig.bankId || 'MB',
      account: envAccount || savedConfig.account || '3108923092004',
      accountName: envAccountName || savedConfig.accountName || 'TUONG THE QUANG',
      isFromEnv: !!(envApiKey || envBankId || envAccount)
    };
  });

  const generatePaymentCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `HP ${result}`;
  };

  const checkEmailExists = async (email: string) => {
    if (!supabase) return { exists: false };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      
      if (error) throw error;
      return { exists: !!data };
    } catch (error) {
      console.error("Error checking email:", error);
      return { exists: false, error: true };
    }
  };

  const handleGoToPayment = async (formData: FormData) => {
    const email = formData.get('email') as string;
    setUserEmail(email);
    setEmailError('');
    setIsCheckingEmail(true);
    
    // 1. Kiểm tra email tồn tại trước khi đi tiếp
    const checkResult = await checkEmailExists(email);
    setIsCheckingEmail(false);

    if (checkResult.exists) {
      setEmailError(`Email "${email}" đã có tài khoản trên hệ thống. Vui lòng đăng nhập hoặc sử dụng email khác.`);
      return;
    }

    if (checkResult.error) {
      setEmailError("Có lỗi xảy ra khi kiểm tra email. Vui lòng thử lại.");
      return;
    }

    const code = generatePaymentCode();
    setPaymentCode(code);
    setIsPaidSuccess(false); // Reset trạng thái thành công
    
    const registrationData = {
      payment_code: code.trim(),
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      package: selectedPackage || 'starter',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      if (!supabase) {
        alert('Vui lòng cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong phần Secrets.');
        return;
      }
      // Đăng ký trực tiếp vào bảng 'registrations' trên Supabase
      const { error } = await supabase
        .from('registrations')
        .insert([registrationData]);

      if (error) throw error;
      setShowQR(true);
    } catch (error) {
      console.error('Supabase registration error:', error);
      alert('Có lỗi xảy ra khi kết nối với Supabase. Vui lòng kiểm tra cấu hình.');
    }
  };

  const getAmount = () => {
    return selectedPackage === 'pro' ? 899000 : 10000;
  };

  const getQRUrl = () => {
    const amount = getAmount();
    // Chuyển sang dùng API chính thức của VietQR.io để tăng độ tương thích "khóa" thông tin
    const bank = (sepayConfig.bankId || sepayConfig.bank || 'MB').toUpperCase();
    const acc = (sepayConfig.account || '3108923092004').trim();
    const name = encodeURIComponent(sepayConfig.accountName || 'TUONG THE QUANG');
    const desc = encodeURIComponent(paymentCode.trim());
    
    // Template 'compact2' của VietQR.io thường được các app ngân hàng ưu tiên xử lý như hóa đơn cố định
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${amount}&addInfo=${desc}&accountName=${name}`;
  };

  const videos = [
    "https://res.cloudinary.com/dze55rv94/video/upload/snaptik.vn_7617690621574319367_1_ktpnvx.mp4",
    "https://res.cloudinary.com/dze55rv94/video/upload/snaptik.vn_7618211839230446856_k4xswb.mp4"
  ];

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#050505] p-0 md:p-8">
      <main className="relative h-screen w-full overflow-hidden bg-background selection:bg-white/20 selection:text-white md:h-[850px] md:max-w-[390px] md:rounded-[3rem] md:border-[12px] md:border-neutral-900 md:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            key={videos[currentVideoIndex]}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="h-full w-full object-cover"
          >
            <source
              src={videos[currentVideoIndex]}
              type="video/mp4"
            />
          </video>
          {/* Overlay to ensure text readability */}
          <div className={`absolute inset-0 transition-all duration-700 ${
            showDetails 
              ? 'bg-background/70 backdrop-blur-xl' 
              : 'bg-black/20'
          }`}></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-20 mx-auto flex w-full items-center justify-between px-6 py-6">
          <div 
            className="group cursor-pointer flex items-center gap-2"
            onClick={() => setShowDetails(false)}
          >
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-8 w-auto rounded-lg object-contain" 
              referrerPolicy="no-referrer"
            />
            <div className="text-xl font-bold tracking-tighter text-foreground" style={{ fontFamily: "Lora, serif" }}>
              MDAI<sup className="text-[10px] opacity-50">®</sup>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="liquid-glass rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-foreground hover:bg-white/10 transition-all"
            >
              {showDetails ? 'Trang chủ' : 'Khám phá'}
            </button>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {!showDetails ? (
            <motion.section 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex min-h-[calc(100%-120px)] flex-col items-center justify-center px-6 py-12 text-center"
            >
              <div className="flex flex-col items-center justify-center space-y-8">
                <h1 
                  className="text-[32px] sm:text-6xl font-bold leading-[1.2] tracking-tight text-white pb-2"
                  style={{ fontFamily: "Lora, serif" }}
                >
                  Biến ý tưởng <br />
                  <span className="italic text-white/80">thành video triệu view</span>
                </h1>

                <p className="max-w-[300px] text-base leading-relaxed text-foreground/70 font-medium">
                  Sở hữu hệ thống tạo video AI tự động và lộ trình khai thác thu nhập bền vững dành cho người mới.
                </p>

                <div className="flex flex-col w-full gap-4 pt-4">
                  <button 
                    onClick={() => setShowDetails(true)}
                    className="shimmer liquid-glass cursor-pointer rounded-2xl bg-white px-10 py-5 text-base font-black text-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                  >
                    Bắt đầu ngay
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Không cần kinh nghiệm đồ họa</p>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section 
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex h-[calc(100%-80px)] flex-col px-6 pb-10 pt-4"
            >
              <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
                <div className="space-y-12">
                  {/* Result Section */}
                  <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>Kết quả thực tế</h2>
                      <p className="text-xs text-muted-foreground">Những gì bạn sẽ đạt được sau khóa học</p>
                    </div>
                    <div className="bento-grid">
                      {[
                        { title: "5 Phút", desc: "Tạo video hoàn chỉnh", icon: "⚡" },
                        { title: "Dễ dàng", desc: "Thao tác kéo thả", icon: "🎨" },
                        { title: "Sáng tạo", desc: "Không giới hạn ý tưởng", icon: "💡" },
                        { title: "Chất lượng", desc: "Chuẩn 4K sắc nét", icon: "💎" }
                      ].map((item, i) => (
                        <div key={i} className="bento-item group">
                          <span className="text-2xl mb-2 group-hover:scale-125 transition-transform">{item.icon}</span>
                          <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                          <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Roadmap */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lộ trình 3 bước</h3>
                      <div className="h-[1px] flex-1 bg-white/10 ml-4"></div>
                    </div>
                    <div className="space-y-4">
                      {[
                        { step: "01", title: "Kích hoạt hệ thống", desc: "Nhận bộ công cụ và tài khoản AI dùng ngay." },
                        { step: "02", title: "Biến ý tưởng thành Prompt", desc: "Sử dụng Tool độc quyền để tạo lệnh vẽ." },
                        { step: "03", title: "Khai thác & Xây kênh", desc: "Triển khai Case Study thực tế để tạo kết quả." }
                      ].map((item) => (
                        <div key={item.step} className="group flex gap-6 rounded-[2.5rem] bg-white/[0.03] p-6 items-center border border-white/5 hover:bg-white/5 transition-all">
                          <span className="text-2xl font-black text-white/10 group-hover:text-white/20 transition-colors">{item.step}</span>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Chọn gói học</h3>
                      <div className="h-[1px] flex-1 bg-white/10 ml-4"></div>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Starter */}
                      <motion.div 
                        onClick={() => setSelectedPackage('starter')}
                        className={`relative cursor-pointer overflow-hidden p-8 rounded-[2.5rem] border transition-all duration-500 ${
                          selectedPackage === 'starter' 
                            ? 'bg-white/10 border-white/30 scale-[1.02] shadow-2xl' 
                            : 'bg-white/[0.03] border-white/5 opacity-80'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-xl font-black text-foreground">Gói STARTER</h4>
                            <p className="text-[11px] text-foreground/50 font-medium mt-1">Học dễ – làm được ngay</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-foreground">10k</span>
                            <p className="text-[9px] uppercase tracking-widest opacity-40">Một lần</p>
                          </div>
                        </div>
                        
                        <ul className="text-[11px] text-foreground/80 space-y-3 mb-8">
                          <li className="flex items-center gap-3"><span className="text-green-500">✓</span> Bài giảng chi tiết, dễ hiểu</li>
                          <li className="flex items-center gap-3"><span className="text-green-500">✓</span> Hướng dẫn làm video AI cơ bản</li>
                          <li className="flex items-center gap-3"><span className="text-green-500">✓</span> Tool tạo prompt ảnh & video</li>
                          <li className="flex items-center gap-3 font-bold text-accent">★ Tặng Grok 1 tháng (150k)</li>
                        </ul>

                        <AnimatePresence>
                          {selectedPackage === 'starter' && (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowQR(false);
                                setShowRegistration(true);
                              }}
                              className="shimmer w-full rounded-2xl bg-white py-4 text-xs font-black text-black shadow-xl"
                            >
                              ĐĂNG KÝ NGAY
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Pro - Highlighted */}
                      <motion.div 
                        onClick={() => setSelectedPackage('pro')}
                        className={`relative cursor-pointer overflow-hidden p-8 rounded-[2.5rem] border transition-all duration-500 ${
                          selectedPackage === 'pro' 
                            ? 'bg-white/15 border-white/40 scale-[1.02] shadow-[0_0_50px_rgba(250,204,21,0.1)] glow-pro' 
                            : 'bg-white/[0.03] border-white/5 opacity-80'
                        }`}
                      >
                        <div className="absolute top-0 right-0 bg-accent text-black text-[9px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">Phổ biến nhất</div>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-xl font-black text-foreground">Gói PRO</h4>
                            <p className="text-[11px] text-foreground/50 font-medium mt-1">Khai thác & Thu nhập</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-foreground">899k</span>
                            <p className="text-[9px] uppercase tracking-widest opacity-40">Một lần</p>
                          </div>
                        </div>
                        
                        <div className="space-y-6 mb-8">
                          <div className="rounded-2xl bg-white/5 p-4 space-y-2 border border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-accent">Ứng dụng thực tế:</p>
                            <ul className="text-[10px] text-foreground/60 space-y-1.5">
                              <li>• Review sản phẩm AI bán hàng</li>
                              <li>• Xây kênh triệu view thời trang</li>
                              <li>• Storytelling khai thác quảng cáo</li>
                            </ul>
                          </div>
                          
                          <ul className="text-[11px] text-foreground/80 space-y-3">
                            <li className="flex items-center gap-3 font-bold"><span className="text-accent">✓</span> Tool tạo Prompt độc quyền</li>
                            <li className="flex items-center gap-3"><span className="text-accent">✓</span> Lộ trình kiếm tiền chuyên sâu</li>
                            <li className="flex items-center gap-3"><span className="text-accent">✓</span> Case Study thực tế</li>
                            <li className="flex items-center gap-3 font-bold text-accent">★ Tặng 01 tháng Grok (150k)</li>
                          </ul>
                        </div>

                        <AnimatePresence>
                          {selectedPackage === 'pro' && (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowQR(false);
                                setShowRegistration(true);
                              }}
                              className="shimmer w-full rounded-2xl bg-accent py-4 text-xs font-black text-black shadow-xl"
                            >
                              ĐĂNG KÝ NGAY
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>

                  {/* Bonus & Scarcity */}
                  <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-white text-black text-center space-y-3 shadow-2xl">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em]">Ưu đãi giới hạn</h4>
                      <p className="text-[11px] font-medium leading-relaxed opacity-70">
                        Áp dụng cho nhóm học viên khởi đầu từ <span className="font-bold">01/04 - 01/05</span>. Học phí sẽ tăng sau thời gian này.
                      </p>
                    </div>

                    <div className="liquid-glass space-y-8 rounded-[3rem] p-10 border border-white/10">
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-black text-foreground uppercase tracking-widest">Giữ chỗ ngay</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Chúng tôi sẽ liên hệ hỗ trợ bạn</p>
                      </div>
                      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setShowRegistration(true); }}>
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Họ và tên của bạn" 
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-foreground outline-none focus:border-white/30 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <input 
                            type="tel" 
                            placeholder="Số điện thoại Zalo" 
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-foreground outline-none focus:border-white/30 transition-all"
                          />
                        </div>
                        <button className="shimmer w-full rounded-2xl bg-white py-5 text-sm font-black text-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                          NHẬN TƯ VẤN MIỄN PHÍ
                        </button>
                      </form>
                    </div>

                    <div className="text-center space-y-4 pb-10">
                      <p className="text-[9px] text-muted-foreground leading-relaxed px-8 uppercase tracking-widest opacity-50">
                        Cam kết bảo mật thông tin • Hỗ trợ 24/7 • Tài liệu cập nhật trọn đời
                      </p>
                      <div className="flex justify-center gap-4 opacity-30">
                        <div className="h-6 w-6 rounded bg-white/20"></div>
                        <div className="h-6 w-6 rounded bg-white/20"></div>
                        <div className="h-6 w-6 rounded bg-white/20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>


        {/* Registration Modal */}
        <AnimatePresence>
          {showRegistration && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-3xl"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="liquid-glass w-full max-w-sm space-y-8 rounded-[2.5rem] border border-white/20 p-10 shadow-2xl"
              >
                <div className="space-y-2 text-center">
                  <h3 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Lora, serif" }}>
                    {isPaidSuccess ? 'Thành công' : showQR ? 'Thanh toán' : 'Đăng ký'}
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {isPaidSuccess ? 'Kích hoạt tài khoản' : showQR ? 'Quét mã QR để hoàn tất' : 'Vui lòng điền thông tin'}
                  </p>
                </div>

                {isPaidSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8 text-center py-6"
                  >
                    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20"></div>
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-2xl font-black text-foreground tracking-tight">Tuyệt vời!</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed px-4">
                        Thanh toán đã được xác nhận. Thông tin tài khoản đã được gửi tới: <br />
                        <span className="font-bold text-foreground mt-1 block">{userEmail}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Bước tiếp theo:</p>
                      <p className="text-[10px] text-foreground/60 mt-1">Kiểm tra email (cả mục Spam) để nhận mật khẩu đăng nhập.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setShowRegistration(false);
                        setIsPaidSuccess(false);
                        setShowQR(false);
                      }}
                      className="shimmer w-full rounded-2xl bg-white py-5 text-sm font-black text-black shadow-2xl"
                    >
                      BẮT ĐẦU HỌC NGAY
                    </button>
                  </motion.div>
                ) : showQR ? (
                  <div className="space-y-8 text-center">
                    <div className="relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-[2rem] bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none"></div>
                      <img 
                        key={paymentCode + sepayConfig.account} 
                        src={getQRUrl()} 
                        alt="Payment QR Code" 
                        className="h-full w-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const errorDiv = parent.querySelector('.qr-error');
                            if (!errorDiv) {
                              const msg = document.createElement('div');
                              msg.className = 'qr-error flex h-full w-full items-center justify-center p-4 text-center text-[10px] text-red-500 font-bold';
                              msg.innerText = '❌ Lỗi tải mã QR. Vui lòng thử lại.';
                              parent.appendChild(msg);
                            }
                          }
                        }}
                      />
                    </div>
                    
                    <div className="space-y-4 rounded-3xl bg-white/5 p-6 border border-white/5">
                      <div className="flex justify-between items-center text-[11px] uppercase tracking-widest">
                        <span className="text-muted-foreground">Số tiền</span>
                        <span className="font-black text-foreground">{getAmount().toLocaleString()}đ</span>
                      </div>
                      <div className="h-[1px] w-full bg-white/5"></div>
                      <div className="flex justify-between items-center text-[11px] uppercase tracking-widest">
                        <span className="text-muted-foreground">Nội dung</span>
                        <span className="font-black text-accent">{paymentCode}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Đang chờ thanh toán...</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => {
                            console.log("🔄 Kiểm tra thủ công...");
                            // Gọi hàm checkInitialStatus từ useEffect thông qua một ref hoặc đơn giản là trigger lại
                            // Ở đây ta sẽ gọi trực tiếp supabase để check nhanh
                            const checkManual = async () => {
                              if (!supabase) return;
                              const normalize = (c: string) => c.replace(/\s+/g, '').toUpperCase();
                              const target = normalize(paymentCode);
                              const { data } = await supabase
                                .from('registrations')
                                .select('status, payment_code')
                                .eq('status', 'completed');
                              
                              const found = data?.find(reg => normalize(reg.payment_code) === target);
                              if (found) {
                                setIsPaidSuccess(true);
                                confetti({
                                  particleCount: 150,
                                  spread: 70,
                                  origin: { y: 0.6 },
                                  colors: ['#ffffff', '#ffd700', '#ff0000']
                                });
                              } else {
                                alert("Hệ thống chưa ghi nhận thanh toán. Vui lòng đợi 1-2 phút hoặc liên hệ hỗ trợ.");
                              }
                            };
                            checkManual();
                          }}
                          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 transition-all"
                        >
                          KIỂM TRA NGAY
                        </button>
                        <button 
                          onClick={() => setShowQR(false)}
                          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                          QUAY LẠI
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={(e) => { 
                    e.preventDefault(); 
                    const formData = new FormData(e.currentTarget);
                    handleGoToPayment(formData); 
                  }}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Họ và tên</label>
                      <input 
                        name="name"
                        type="text" 
                        required
                        placeholder="Nguyễn Văn A" 
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-foreground outline-none focus:border-white/30 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email (Gmail)</label>
                      <input 
                        name="email"
                        type="email" 
                        required
                        pattern=".+@gmail\.com"
                        title="Vui lòng sử dụng địa chỉ email kết thúc bằng @gmail.com"
                        placeholder="example@gmail.com" 
                        className={`w-full rounded-2xl border bg-white/5 px-6 py-4 text-sm text-foreground outline-none transition-all ${
                          emailError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-white/30'
                        }`}
                      />
                      {emailError && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[9px] font-bold text-red-500 uppercase tracking-wider ml-2"
                        >
                          ⚠️ {emailError}
                        </motion.p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Số điện thoại</label>
                      <input 
                        name="phone"
                        type="tel" 
                        required
                        placeholder="09xx xxx xxx" 
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-foreground outline-none focus:border-white/30 transition-all"
                      />
                    </div>

                    <div className="pt-4 space-y-4">
                      <button 
                        type="submit"
                        disabled={isCheckingEmail}
                        className="shimmer w-full rounded-2xl bg-white py-5 text-sm font-black text-black shadow-2xl disabled:opacity-50"
                      >
                        {isCheckingEmail ? 'ĐANG KIỂM TRA...' : 'TIẾP TỤC THANH TOÁN'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowRegistration(false)}
                        className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        HỦY BỎ
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
