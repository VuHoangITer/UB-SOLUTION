/**
 * ==================== TỰ ĐỘNG ĐÓNG THÔNG BÁO ====================
 * File: 03-auto-dismiss-alerts.js
 * Tạo tự động từ: main.js
 * Ngày tạo: 03/11/2025 11:12:09
 * ==========================================================================
 * 

        📍 Vị trí: Mọi trang có flash messages
        🎯 Chức năng: Tự động đóng thông báo Bootstrap sau 3 giây
        📄 Sử dụng tại:
           - layouts/base.html ({% with messages = get_flashed_messages() %})
           - Các trang admin sau khi submit form
        🔧 Hoạt động:
           - Target: .alert.alert-dismissible
           - Timeout: 3000ms (3 giây)
           - Dùng bootstrap.Alert().close()
        
 * ==========================================================================
 */

// ==================== AUTO DISMISS ALERTS ====================
document.addEventListener("DOMContentLoaded", function () {
  const alerts = document.querySelectorAll(".alert.alert-dismissible");
  alerts.forEach((alert) => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 3000);
  });
});

