/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function App() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background selection:bg-white/20 selection:text-white">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source
            src="https://res.cloudinary.com/dze55rv94/video/upload/snaptik.vn_7617690621574319367_1_ktpnvx.mp4"
            type="video/mp4"
          />
        </video>
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-background/40 backdrop-brightness-75"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8 md:py-6">
        <div 
          className="text-2xl tracking-tight text-foreground md:text-3xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          MDAI<sup className="text-xs">®</sup>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#" className="text-sm font-medium text-foreground transition-colors">Trang chủ</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Studio</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Giới thiệu</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Nhật ký</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Liên hệ</a>
        </div>

        <button className="liquid-glass rounded-full px-4 py-2 text-xs font-medium text-foreground hover:scale-[1.03] md:px-6 md:py-2.5 md:text-sm">
          Bắt đầu
        </button>
      </nav>

      {/* Hero Content */}
      <section className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-12 text-center md:min-h-0 md:py-[90px] md:pt-32 md:pb-40">
        <div className="flex flex-col items-center justify-center space-y-8 md:space-y-0">
          <h1 
            className="animate-fade-rise max-w-7xl text-4xl font-normal leading-[1.1] tracking-[-1px] text-foreground sm:text-7xl md:text-8xl md:leading-[0.95] md:tracking-[-2.46px]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Nơi những <em className="not-italic text-muted-foreground">giấc mơ</em> vươn mình <em className="not-italic text-muted-foreground">trong tĩnh lặng.</em>
          </h1>

          <p className="animate-fade-rise-delay max-w-md text-sm leading-relaxed text-muted-foreground md:mt-8 md:max-w-2xl md:text-lg">
            Chúng tôi đang thiết kế các công cụ dành cho những người suy nghĩ sâu sắc, những nhà sáng tạo táo bạo và những kẻ nổi loạn thầm lặng.
            Giữa sự hỗn loạn, chúng tôi xây dựng không gian kỹ thuật số để tập trung cao độ và làm việc đầy cảm hứng.
          </p>

          <button className="liquid-glass animate-fade-rise-delay-2 cursor-pointer rounded-full px-10 py-4 text-sm font-medium text-foreground hover:scale-[1.03] md:mt-12 md:px-14 md:py-5 md:text-base">
            Bắt đầu hành trình
          </button>
        </div>
      </section>
    </main>
  );
}
