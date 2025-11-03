/**
 * ==================== HIỆU ỨNG CUỘN TRANG ====================
 * File: 02-animate-scroll.js
 * Tạo tự động từ: main.js
 * Ngày tạo: 03/11/2025 11:12:09
 * ==========================================================================
 * 

        📍 Vị trí: Áp dụng cho tất cả card
        🎯 Chức năng: Tự động thêm animation khi card xuất hiện trong viewport
        📄 Sử dụng tại:
           - components/card_product.html (thẻ sản phẩm)
           - components/card_blog.html (thẻ tin tức)
        🔧 Hoạt động: 
           - Dùng IntersectionObserver API
           - Thêm class "animate-on-scroll" khi element vào màn hình
           - threshold: 0.1 (10% element hiển thị)
        
 * ==========================================================================
 */

// ==================== ANIMATE ON SCROLL ====================
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animate-on-scroll");
    }
  });
}, observerOptions);

// Observe all product cards and blog cards
document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".product-card, .blog-card");
  cards.forEach((card) => {
    observer.observe(card);
  });
});

