/**
 * ==================== LOADING TOÀN TRANG ====================
 * File: 10-page-loader.js
 * Tạo tự động từ: main.js
 * Ngày tạo: 03/11/2025 11:12:09
 * ==========================================================================
 * 

        📍 Vị trí: Tất cả các trang
        🎯 Chức năng: Hiển thị spinner khi trang đang load, ẩn khi xong
        📄 Sử dụng tại:
           - layouts/base.html (id="page-loader")
           - CSS: 17-loading.css
        🔧 Hoạt động:
           - Trigger: window load event
           - Fade out: opacity = 0 (transition 300ms)
           - Remove: setTimeout 300ms để xóa khỏi DOM
        💡 Cải thiện UX khi trang load chậm (hình ảnh lớn, JS nhiều)
        
 * ==========================================================================
 */

// ==================== Page-loader ====================
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 1000);
  }
});

