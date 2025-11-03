/**
 * ==================== CHATBOT HỖ TRỢ KHÁCH HÀNG ====================
 * File: 12-chatbot.js
 * Tạo tự động từ: main.js
 * Ngày tạo: 03/11/2025 11:12:09
 * ==========================================================================
 * 

        📍 Vị trí: Góc phải dưới màn hình (trên scroll-to-top)
        🎯 Chức năng: Chatbot AI hỗ trợ khách hàng 24/7
        📄 Sử dụng tại:
           - layouts/base.html (id="chatbotButton", id="chatbotWidget")
           - components/chatbot.html
           - CSS: 26-chatbot.css
           - Backend: app/chatbot/routes.py
        🔧 Các tính năng:
           - ✅ FULL SCREEN MOBILE: Chiếm toàn màn hình trên mobile
           - ✅ NO AUTO-FOCUS: Không tự động mở bàn phím
           - ✅ BODY SCROLL LOCK: Khóa scroll body khi mở (iOS fix)
           - ✅ TYPING INDICATOR: Hiệu ứng "đang gõ..." khi bot trả lời
           - ✅ AUTO SCROLL: Tự động scroll xuống tin nhắn mới
           - ✅ REQUEST LIMIT: Hiển thị số tin nhắn còn lại (20/session)
           - ✅ RESET CHAT: Nút làm mới hội thoại
           - ✅ ERROR HANDLING: Xử lý lỗi mạng, server
           - ✅ INPUT VALIDATION: Giới hạn 500 ký tự
           - ✅ ESCAPE HTML: Bảo mật XSS
        🌐 API Endpoints:
           - POST /chatbot/send → Gửi tin nhắn
           - POST /chatbot/reset → Reset session
        💡 Dùng Flask session để lưu lịch sử chat
        
 * ==========================================================================
 */

// ==================== Chatbot Widget ====================
class ChatbotWidget {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.remainingRequests = 20;

        // DOM elements
        this.chatButton = document.getElementById('chatbotButton');
        this.chatWidget = document.getElementById('chatbotWidget');
        this.closeBtn = document.getElementById('chatbotCloseBtn');
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.userInput = document.getElementById('chatbotInput');
        this.sendBtn = document.getElementById('chatbotSendBtn');
        this.resetBtn = document.getElementById('chatbotResetBtn');
        this.requestCountEl = document.getElementById('requestCount');

        if (!this.chatButton || !this.chatWidget) {
            console.error('Chatbot elements not found');
            return;
        }

        this.init();
    }

    init() {
        this.chatButton.addEventListener('click', () => this.toggleChat());
        this.closeBtn.addEventListener('click', () => this.toggleChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.resetBtn.addEventListener('click', () => this.resetChat());

        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // ❌ XÓA AUTO-FOCUS - KHÔNG CÒN TỰ ĐỘNG MỞ BÀN PHÍM
        // Không dùng transitionend để focus nữa

        console.log('Chatbot initialized successfully');
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatWidget.classList.toggle('active');

        // ✅ THÊM/XÓA CLASS VÀO BODY
        if (this.isOpen) {
            document.body.classList.add('chatbot-open');
            this.scrollToBottom();

            // Fix cho iOS: Ngăn body scroll
            if (this.isMobile()) {
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                document.body.style.top = '0';
            }
        } else {
            document.body.classList.remove('chatbot-open');

            // Khôi phục scroll
            if (this.isMobile()) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                document.body.style.top = '';
            }
        }
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    async sendMessage() {
        const message = this.userInput.value.trim();

        if (!message || this.isTyping) {
            return;
        }

        if (message.length > 500) {
            alert('Tin nhắn quá dài! Vui lòng nhập tối đa 500 ký tự.');
            return;
        }

        this.addMessage(message, 'user');
        this.userInput.value = '';
        this.setInputState(false);
        this.showTyping();

        try {
            const response = await fetch('/chatbot/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            this.hideTyping();

            if (response.ok) {
                this.addMessage(data.response, 'bot');

                if (data.remaining_requests !== undefined) {
                    this.remainingRequests = data.remaining_requests;
                    this.updateRequestCount();
                }
            } else {
                this.addMessage(
                    data.error || data.response || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại! 😊',
                    'bot'
                );
            }

        } catch (error) {
            console.error('Chatbot error:', error);
            this.hideTyping();
            this.addMessage(
                'Xin lỗi, không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng! 🔌',
                'bot'
            );
        } finally {
            this.setInputState(true);
            // ❌ KHÔNG FOCUS SAU KHI GỬI - TRÁNH MỞ BÀN PHÍM
            // this.userInput.focus(); // Đã xóa dòng này
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'chatbot-message-content';
        contentDiv.innerHTML = this.escapeHtml(text).replace(/\n/g, '<br>');

        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTyping() {
        this.isTyping = true;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-message bot';
        typingDiv.id = 'chatbotTypingIndicator';

        const typingContent = document.createElement('div');
        typingContent.className = 'chatbot-typing';
        typingContent.innerHTML = '<span></span><span></span><span></span>';

        typingDiv.appendChild(typingContent);
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('chatbotTypingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    setInputState(enabled) {
        this.userInput.disabled = !enabled;
        this.sendBtn.disabled = !enabled;
        this.sendBtn.style.opacity = enabled ? '1' : '0.5';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    async resetChat() {
        if (!confirm('Bạn có chắc muốn làm mới hội thoại? Tất cả tin nhắn sẽ bị xóa.')) {
            return;
        }

        try {
            const response = await fetch('/chatbot/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const messages = this.messagesContainer.querySelectorAll('.chatbot-message');
                messages.forEach((msg, index) => {
                    if (index > 0) {
                        msg.remove();
                    }
                });

                this.remainingRequests = 20;
                this.updateRequestCount();
                this.addMessage('Đã làm mới hội thoại! Tôi có thể giúp gì cho bạn? 😊', 'bot');
            }
        } catch (error) {
            console.error('Reset error:', error);
            alert('Không thể làm mới hội thoại. Vui lòng thử lại!');
        }
    }

    updateRequestCount() {
        if (this.requestCountEl) {
            this.requestCountEl.textContent = `Còn ${this.remainingRequests} tin nhắn`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chatbotButton')) {
        new ChatbotWidget();
    }
});
