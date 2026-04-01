/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [showDetails, setShowDetails] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

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
        <nav className="relative z-10 mx-auto flex w-full items-center justify-between px-6 py-6">
          <div 
            className="cursor-pointer text-2xl tracking-tight text-foreground drop-shadow-md"
            style={{ fontFamily: "'Instrument Serif', serif" }}
            onClick={() => setShowDetails(false)}
          >
            MDAI<sup className="text-[10px]">®</sup>
          </div>

          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="liquid-glass rounded-full px-4 py-2 text-xs font-medium text-foreground hover:scale-[1.03] shadow-lg"
          >
            {showDetails ? 'Trang chủ' : 'Bắt đầu'}
          </button>
        </nav>

        <AnimatePresence mode="wait">
          {!showDetails ? (
            <motion.section 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-[calc(100%-80px)] flex-col items-center justify-center px-6 pb-20 text-center"
            >
              <div className="flex flex-col items-center justify-center space-y-8">
                <h1 
                  className="text-4xl font-normal leading-[1.1] tracking-[-1px] text-foreground drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Biến ý tưởng thành <em className="not-italic text-muted-foreground">hình ảnh triệu view</em> - Không cần biết vẽ.
                </h1>

                <p className="max-w-[280px] text-xs leading-relaxed text-foreground drop-shadow-md font-medium">
                  Sở hữu hệ thống tạo ảnh AI tự động và lộ trình khai thác thu nhập bền vững dành riêng cho người mới.
                </p>

                <button 
                  onClick={() => setShowDetails(true)}
                  className="liquid-glass cursor-pointer rounded-full px-8 py-4 text-xs font-medium text-foreground hover:scale-[1.03] shadow-xl"
                >
                  Khám phá hệ thống ngay
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.section 
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-[calc(100%-80px)] flex-col px-6 pb-10 pt-4"
            >
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="space-y-10">
                  {/* Result Section */}
                  <div className="space-y-4">
                    <h2 
                      className="text-3xl font-normal text-foreground"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      Kết quả bạn sẽ đạt được
                    </h2>
                    <ul className="space-y-3 text-[11px] text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground"></span>
                        Tự tay tạo ra những bộ ảnh nghệ thuật, chân thực chỉ sau 5 phút thao tác.
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground"></span>
                        Sở hữu kho Prompt "mì ăn liền" - Chỉ cần Copy & Paste là có ảnh đẹp.
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground"></span>
                        Biết cách đóng gói hình ảnh thành sản phẩm có giá trị thực tế.
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-foreground"></span>
                        Làm chủ công cụ AI hàng đầu mà không cần máy tính cấu hình mạnh.
                      </li>
                    </ul>
                  </div>

                  {/* Roadmap */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Lộ trình 3 bước đơn giản</h3>
                    <div className="grid gap-3">
                      {[
                        { step: "01", title: "Kích hoạt hệ thống", desc: "Nhận bộ công cụ và tài khoản AI dùng ngay." },
                        { step: "02", title: "Chọn mẫu & Copy", desc: "Sử dụng kho Prompt có sẵn cho mọi ngành hàng." },
                        { step: "03", title: "Xuất bản & Kết nối", desc: "Đưa sản phẩm lên các nền tảng và khai thác." }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 rounded-2xl bg-white/5 p-4">
                          <span className="text-lg font-bold text-muted-foreground/30">{item.step}</span>
                          <div>
                            <h4 className="text-xs font-medium text-foreground">{item.title}</h4>
                            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Intro */}
                  <div className="rounded-3xl bg-white/5 p-6 border border-white/5">
                    <p className="text-xs leading-relaxed text-foreground/90 italic">
                      "Đây không phải là một khóa học lý thuyết suông. Đây là <span className="text-foreground font-bold">Hệ thống Khai thác Hình ảnh AI Toàn diện</span> - Nơi chúng tôi chuẩn bị sẵn 'cần câu' và chỉ cho bạn chính xác 'vùng nước' có cá."
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Lựa chọn gói phù hợp</h3>
                    
                    {/* Starter */}
                    <div className="liquid-glass border border-white/5 p-5 rounded-3xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-foreground">Gói Starter</h4>
                        <span className="text-sm font-bold text-foreground">499k</span>
                      </div>
                      <ul className="text-[10px] text-muted-foreground space-y-1">
                        <li>• Hệ thống tạo ảnh cơ bản</li>
                        <li>• Kho Prompt thời trang</li>
                        <li>• Group Zalo hỗ trợ</li>
                      </ul>
                    </div>

                    {/* Pro - Highlighted */}
                    <div className="relative overflow-hidden p-6 rounded-3xl space-y-4 border border-white/20 bg-white/10 backdrop-blur-xl ring-1 ring-white/30">
                      <div className="absolute top-0 right-0 bg-foreground text-background text-[8px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Khuyên dùng</div>
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-foreground">Gói PRO</h4>
                        <span className="text-lg font-black text-foreground">899k</span>
                      </div>
                      <ul className="text-[10px] text-foreground/90 space-y-2">
                        <li className="flex items-center gap-2 font-bold text-foreground">✓ Tặng Tool AI 01 tháng bản quyền</li>
                        <li>✓ Hướng dẫn kiếm tiền chuyên sâu</li>
                        <li>✓ Case Study thực tế (người thật việc thật)</li>
                        <li>✓ Kho Prompt đa ngành hàng</li>
                        <li>✓ Tất cả quyền lợi gói Starter</li>
                      </ul>
                    </div>

                    {/* VIP */}
                    <div className="liquid-glass border border-white/5 p-5 rounded-3xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-foreground">Gói VIP</h4>
                        <span className="text-sm font-bold text-foreground">1.999k</span>
                      </div>
                      <ul className="text-[10px] text-muted-foreground space-y-1">
                        <li>• Hỗ trợ 1:1 trực tiếp với chuyên gia</li>
                        <li>• Chiến lược xây dựng thương hiệu cá nhân</li>
                        <li>• Tất cả quyền lợi gói PRO</li>
                      </ul>
                    </div>
                  </div>

                  {/* Bonus & Scarcity */}
                  <div className="space-y-6">
                    <div className="p-5 rounded-3xl bg-foreground text-background text-center space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest">Ưu đãi giới hạn</h4>
                      <p className="text-[10px] font-medium opacity-80">Giảm 50% chỉ dành cho 20 người đăng ký sớm nhất.</p>
                      <div className="text-sm font-black">Chỉ còn 6 suất cuối cùng!</div>
                    </div>

                    <div className="liquid-glass space-y-4 rounded-3xl p-6">
                      <h3 className="text-center text-sm font-medium text-foreground">Đăng ký tư vấn ngay</h3>
                      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                        <input 
                          type="text" 
                          placeholder="Họ và tên" 
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-foreground outline-none focus:border-white/20"
                        />
                        <select className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-foreground outline-none focus:border-white/20 appearance-none">
                          <option value="pro" className="bg-neutral-900">Gói PRO (899k) - Khuyên dùng</option>
                          <option value="starter" className="bg-neutral-900">Gói Starter (499k)</option>
                          <option value="vip" className="bg-neutral-900">Gói VIP (1.999k)</option>
                        </select>
                        <input 
                          type="tel" 
                          placeholder="Số điện thoại Zalo" 
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-foreground outline-none focus:border-white/20"
                        />
                        <button className="w-full rounded-xl bg-foreground py-3 text-xs font-semibold text-background transition-transform hover:scale-[1.02] active:scale-[0.98]">
                          Nhận ưu đãi ngay
                        </button>
                      </form>
                    </div>

                    <p className="text-[9px] text-center text-muted-foreground leading-relaxed px-4">
                      * Kết quả thực tế phụ thuộc vào sự tập trung và nỗ lực triển khai của từng cá nhân. Chúng tôi cung cấp hệ thống và công cụ tốt nhất, phần còn lại nằm ở hành động của bạn.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
