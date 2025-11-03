/**
 * ==================== NÚT HÀNH ĐỘNG NỔI ====================
 * File: 01-floating-buttons.js
 * Tạo tự động từ: main.js
 * Ngày tạo: 03/11/2025 11:12:09
 * ==========================================================================
 * 

        📍 Vị trí: Góc phải màn hình
        🎯 Chức năng: Hiển thị các nút floating (Phone, Zalo, Messenger)
        📄 Sử dụng tại: 
           - layouts/base.html (component floating-buttons)
           - Tất cả các trang public
        🔧 Hoạt động: Luôn hiển thị khi scroll, style.display = "flex"
        
 * ==========================================================================
 */

// ==================== FLOATING BUTTONS ====================
window.addEventListener("scroll", function () {
  const floatingButtons = document.querySelector(".floating-buttons");
  if (floatingButtons) {
    floatingButtons.style.display = "flex"; // luôn hiển thị
  }
});

