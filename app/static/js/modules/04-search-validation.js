/**
 * ==================== KIỂM TRA FORM TÌM KIẾM ====================
 * File: 04-search-validation.js
 * Tạo tự động từ: main.js
 * Ngày tạo: 03/11/2025 11:12:09
 * ==========================================================================
 * 

        📍 Vị trí: Thanh tìm kiếm navbar và trang search
        🎯 Chức năng: Ngăn submit form tìm kiếm khi input rỗng
        📄 Sử dụng tại:
           - layouts/base.html (form search trong navbar)
           - public/search.html (trang tìm kiếm chính)
        🔧 Hoạt động:
           - Target: form[action*="search"]
           - Kiểm tra input[name="q"] hoặc input[name="search"]
           - preventDefault() nếu value.trim() === ""
           - Hiện alert "Vui lòng nhập từ khóa tìm kiếm"
        
 * ==========================================================================
 */

// ==================== SEARCH FORM VALIDATION ====================
document.addEventListener("DOMContentLoaded", function () {
  const searchForms = document.querySelectorAll('form[action*="search"]');
  searchForms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      const input = form.querySelector('input[name="q"], input[name="search"]');
      if (input && input.value.trim() === "") {
        e.preventDefault();
        alert("Vui lòng nhập từ khóa tìm kiếm");
      }
    });
  });
});

