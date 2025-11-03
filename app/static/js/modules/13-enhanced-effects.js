/**
 * ==================== HIỆU ỨNG NÂNG CAO TRANG CHỦ ====================
 * File: 13-enhanced-effects.js
 * Tạo tự động từ: main.js
 * Ngày tạo: 03/11/2025 11:12:09
 * ==========================================================================
 * 

    📍 Vị trí: Chỉ áp dụng trên trang chủ (index.html)
    🎯 Chức năng: Bộ hiệu ứng cao cấp để tăng trải nghiệm người dùng
    📄 Sử dụng tại:
       - public/index.html (tất cả sections)
       - CSS: Không cần file riêng, tự inject style
    🔧 Các hiệu ứng bao gồm:
       1. ✅ ANIMATED COUNTER: Đếm tăng dần cho số liệu thống kê
          - Target: .about-stats h3, .stat-number h3
          - Duration: 4000ms (4 giây)
          - Step: 100 (mỗi bước tăng 100)
          - Trigger: IntersectionObserver (threshold: 0.5)
          - Hiệu ứng: Màu chữ chuyển sang brand-primary khi đếm

       2. ✅ PARALLAX SCROLLING: Ảnh di chuyển chậm hơn nội dung
          - Target: .video-container img
          - Speed: 0.3 (30% tốc độ scroll)
          - Throttle: 10ms để tối ưu performance
          - willChange: transform (GPU acceleration)

       3. ✅ SMOOTH REVEAL: Hiệu ứng fade-in mượt mà
          - Target: .product-card, .blog-card, .process-step, section h2
          - Stagger delay: 100ms giữa các elements
          - Animation: opacity 0→1 + translateY(30px→0)
          - Duration: 600ms ease

       4. ✅ MAGNETIC BUTTONS: Nút bị "hút" theo chuột (desktop)
          - Target: .btn-warning, .btn-dark, .btn-outline-warning
          - Loại trừ: .mobile-blog-carousel-btn
          - Movement: 15% của khoảng cách chuột-tâm nút
          - Smooth: transform 0.2s ease-out

       5. ✅ TYPING ANIMATION: Hiệu ứng đánh máy cho heading
          - Target: .about-content h2, #featured-projects h2
          - Speed: 80ms/ký tự
          - Cursor: 2px solid border với blink animation
          - Auto remove cursor sau khi hoàn thành

    🎨 Namespace: window.EnhancedEffects (tránh xung đột)
    🚀 Auto-init: Tự động khởi tạo khi DOM ready
    🧹 Cleanup: Tự động dọn dẹp khi beforeunload

    ⚠️ Lưu ý:
       - Magnetic Buttons CHỈ hoạt động trên desktop (>= 768px)
       - Parallax có throttle để tránh lag
       - Tất cả dùng IntersectionObserver → hiệu suất cao
       - Không xung đột với hiệu ứng animate-on-scroll đã có
    
 * ==========================================================================
 */

// ==================== ENHANCED EFFECTS FOR INDEX PAGE ==================== /
// ==================== NAMESPACE RIÊNG ĐỂ TRÁNH XUNG ĐỘT ====================
window.EnhancedEffects = window.EnhancedEffects || {};

(function(EE) {
  'use strict';

// ==================== ANIMATED COUNTER ====================
// Đếm tăng dần cho phần thống kê, có thể chỉnh bước đếm
EE.AnimatedCounter = {
  counters: [],
  isAnimated: new Set(),

  init: function() {
    this.counters = document.querySelectorAll('.about-stats h3, .stat-number h3');
    if (this.counters.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isAnimated.has(entry.target)) {
            this.animateCounter(entry.target);
            this.isAnimated.add(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    this.counters.forEach(counter => observer.observe(counter));
  },

  animateCounter: function(element) {
    let text = element.textContent.trim();
    const match = text.match(/[\d.,]+/);
    if (!match) return;

    // Làm sạch số: bỏ . và ,
    const targetNumber = parseInt(match[0].replace(/[.,]/g, ''), 10);
    const suffix = text.replace(match[0], '').trim(); // ví dụ '+'

    // ⚙️ Cấu hình
    const duration = 1000;   // Tổng thời gian chạy (ms)
    const step = 60;        // Mỗi lần tăng bao nhiêu
    const totalSteps = Math.ceil(targetNumber / step);
    const intervalTime = duration / totalSteps;

    let current = 0;

    const originalColor = window.getComputedStyle(element).color;
    element.style.color = 'var(--brand-primary)';
    element.style.transition = 'color 0.3s ease';

    const timer = setInterval(() => {
      current += step;
      if (current >= targetNumber) {
        current = targetNumber;
        clearInterval(timer);
        element.style.color = originalColor;
      }

      element.textContent = `${current.toLocaleString('vi-VN')}${suffix}`;
    }, intervalTime);
  }
};


  // ==================== PARALLAX SCROLLING ====================
  // Hiệu ứng parallax cho images
  EE.ParallaxEffect = {
    elements: [],

    init: function() {
      const parallaxConfig = [
        { selector: '.video-container img', speed: 0.3 },
      ];

      parallaxConfig.forEach(config => {
        const els = document.querySelectorAll(config.selector);
        els.forEach(el => {
          this.elements.push({ el: el, speed: config.speed });
        });
      });

      if (this.elements.length > 0) {
        this.handleScroll();
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 10));
      }
    },

    handleScroll: function() {
      const scrolled = window.pageYOffset;

      this.elements.forEach(item => {
        const rect = item.el.getBoundingClientRect();
        const elementTop = rect.top + scrolled;
        const windowHeight = window.innerHeight;

        if (rect.top < windowHeight && rect.bottom > 0) {
          const yPos = -((scrolled - elementTop) * item.speed);
          item.el.style.transform = `translateY(${yPos}px)`;
          item.el.style.willChange = 'transform';
        }
      });
    },

    throttle: function(func, delay) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          return func(...args);
        }
      };
    }
  };

  // ==================== SMOOTH REVEAL ANIMATION ====================
  // Hiệu ứng xuất hiện mượt mà cho elements
  EE.SmoothReveal = {
    elements: [],

    init: function() {
      this.elements = document.querySelectorAll(`
        .product-card:not(.animate-on-scroll),
        .blog-card:not(.animate-on-scroll),
        .process-step,
        .feature-item,
        section h2,
        .title-underline
      `);

      if (this.elements.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                entry.target.classList.add('revealed');
              }, index * 100); // Stagger effect
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      // Thêm class initial state
      this.elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
      });

      // CSS cho revealed state
      const style = document.createElement('style');
      style.textContent = `
        .revealed {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      document.head.appendChild(style);
    }
  };

  // ====================  MAGNETIC BUTTONS ====================
  // Nút CTA "hút" chuột khi di chuyển gần
  EE.MagneticButtons = {
    buttons: [],

    init: function() {
      // Chỉ áp dụng trên desktop
      if (window.innerWidth < 768) return;

      this.buttons = document.querySelectorAll(`
        .btn-dark
      `);

      this.buttons.forEach(btn => {
        btn.style.transition = 'transform 0.2s ease-out';

        btn.addEventListener('mousemove', this.handleMouseMove.bind(this));
        btn.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
      });
    },

    handleMouseMove: function(e) {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const moveX = x * 0.15;
      const moveY = y * 0.15;

      btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
    },

    handleMouseLeave: function(e) {
      const btn = e.currentTarget;
      btn.style.transform = 'translate(0, 0)';
    }
  };

  // ====================  TEXT TYPING ANIMATION ====================
  // Hiệu ứng đánh máy cho heading
  EE.TypingAnimation = {
    elements: [],

    init: function() {
      // Tìm heading "BRICON VIỆT NAM" trong about section
      const heading = document.querySelector('.about-content h2, #featured-projects h2:first-of-type');

      if (!heading) return;

      const originalText = heading.textContent;
      heading.setAttribute('data-original-text', originalText);
      heading.textContent = '';
      heading.style.borderRight = '2px solid var(--brand-primary)';
      heading.style.animation = 'blink 0.7s step-end infinite';

      // CSS cho cursor nhấp nháy
      const style = document.createElement('style');
      style.textContent = `
        @keyframes blink {
          from, to { border-color: transparent; }
          50% { border-color: var(--brand-primary); }
        }
      `;
      document.head.appendChild(style);

      // Observer để bắt đầu typing khi vào viewport
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.typeText(heading, originalText);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(heading);
    },

    typeText: function(element, text) {
      let index = 0;
      const speed = 80; // milliseconds

      const type = () => {
        if (index < text.length) {
          element.textContent += text.charAt(index);
          index++;
          setTimeout(type, speed);
        } else {
          // Xóa cursor sau khi hoàn thành
          setTimeout(() => {
            element.style.borderRight = 'none';
            element.style.animation = 'none';
          }, 500);
        }
      };

      type();
    }
  };

  // ==================== KHỞI TẠO TẤT CẢ HIỆU ỨNG ====================
  EE.init = function() {
    // Đợi DOM load xong
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initAll();
      });
    } else {
      this.initAll();
    }
  };

  EE.initAll = function() {
    console.log('🎨 Initializing Enhanced Effects...');

    try {
      // Các hiệu ứng không phụ thuộc scroll
      this.AnimatedCounter.init();
      this.MagneticButtons.init();
      this.TypingAnimation.init();

      // Hiệu ứng scroll-based (delay nhỏ để tránh lag)
      setTimeout(() => {
        this.ParallaxEffect.init();
        this.SmoothReveal.init();
      }, 100);

      console.log('✅ Enhanced Effects loaded successfully!');
    } catch (error) {
      console.error('❌ Enhanced Effects error:', error);
    }
  };

  // ==================== AUTO INIT ====================
  EE.init();

})(window.EnhancedEffects);

// ==================== CLEANUP ON PAGE UNLOAD ====================
window.addEventListener('beforeunload', function() {
  // Cleanup để tránh memory leaks
  if (window.EnhancedEffects) {
    window.EnhancedEffects = null;
  }
});

