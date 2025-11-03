/**
 * ==================== NÚT LÊN ĐẦU TRANG + TIẾN TRÌNH ====================
 * File: 07-scroll-to-top.js
 * Tạo tự động từ: main.js
 * Ngày tạo: 03/11/2025 11:12:09
 * ==========================================================================
 * 

        📍 Vị trí: Góc phải dưới màn hình
        🎯 Chức năng: 
           - Hiện nút khi scroll > 300px
           - Vòng tròn progress theo % scroll
           - Click để lên đầu trang
        📄 Sử dụng tại:
           - layouts/base.html (id="scrollToTop")
           - CSS: 20-scroll-to-top.css
        🔧 Hoạt động:
           - Dùng SVG circle với strokeDasharray/strokeDashoffset
           - Tính scrollPercentage = scrollTop / scrollHeight
           - Update offset theo % để vẽ progress circle
           - requestAnimationFrame để smooth
           - Show button: scrollTop > 300px
        
 * ==========================================================================
 */

// ==================== SCROLL TO TOP WITH PROGRESS ====================
(function () {
  const scrollToTopBtn = document.getElementById("scrollToTop");
  if (!scrollToTopBtn) return;

  const progressCircle = scrollToTopBtn.querySelector("circle.progress");
  const radius = progressCircle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  // Set initial progress circle
  progressCircle.style.strokeDasharray = circumference;
  progressCircle.style.strokeDashoffset = circumference;

  // Update progress on scroll
  function updateProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;

    // Update progress circle
    const offset = circumference - (scrollPercentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    // Show/hide button
    if (scrollTop > 300) {
      scrollToTopBtn.classList.add("show");
    } else {
      scrollToTopBtn.classList.remove("show");
    }
  }

  // Smooth scroll to top
  scrollToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Listen to scroll event
  let ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial check
  updateProgress();
})();

