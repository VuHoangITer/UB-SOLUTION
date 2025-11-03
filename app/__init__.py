from flask import Flask, g, request, redirect, render_template, flash, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_compress import Compress
from app.config import Config
import cloudinary
import os
from dotenv import load_dotenv
import pytz

# Khởi tạo extensions
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
compress = Compress()

# Timezone Việt Nam
VN_TZ = pytz.timezone('Asia/Ho_Chi_Minh')

# ===== CACHE GLOBAL (TTL) =====
_CATEGORIES_CACHE = None
_CACHE_TIMESTAMP = None
_CACHE_TTL = 0  # 5 phút


def create_app(config_class=Config):
    """Factory function để tạo Flask app - Tối ưu cho Render"""
    load_dotenv()
    app = Flask(__name__)

    # ==================== CONFIG ====================
    app.config.from_object(config_class)
    app.config['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY')
    app.config['CHATBOT_ENABLED'] = True

    # Session Security
    app.config['SESSION_COOKIE_SECURE'] = True  # HTTPS only
    app.config['SESSION_COOKIE_HTTPONLY'] = True  # No JS access
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

    # Upload Security
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

    # Static files caching
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

    # ==================== INIT EXTENSIONS ====================
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    compress.init_app(app)  # ✅ bật nén HTTP

    # ==================== CLOUDINARY ====================
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET'),
        secure=True
    )

    # ==================== FLASK-LOGIN ====================
    login_manager.login_view = 'admin.login'
    login_manager.login_message = 'Vui lòng đăng nhập để truy cập trang này.'
    login_manager.login_message_category = 'warning'

    # ==================== REGISTER BLUEPRINTS ====================
    from app.main import main_bp
    from app.admin import admin_bp
    from app.chatbot import chatbot_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(chatbot_bp)

    # ==================== GEMINI INIT ====================
    with app.app_context():
        from app.chatbot.routes import init_gemini
        init_gemini()

    # Khởi tạo cấu hình logging, v.v.
    config_class.init_app(app)

    # ==================== CONTEXT PROCESSOR (TTL + per-request g) ====================
    @app.context_processor
    def inject_globals():
        """
        - TTL cache (process-level) 5 phút để tránh query lặp qua nhiều request
        - Per-request cache bằng g.* để 1 request không query lại
        - ✅ Feature flags context
        """
        from app.models.settings import get_setting
        from app.models.product import Category
        from app.models.features import get_feature_context  # ✅ THÊM DÒNG NÀY
        from datetime import datetime
        import time

        global _CATEGORIES_CACHE, _CACHE_TIMESTAMP

        # per-request guard
        if not hasattr(g, 'all_categories'):
            now = time.time()
            need_refresh = (
                    _CATEGORIES_CACHE is None or
                    _CACHE_TIMESTAMP is None or
                    (now - _CACHE_TIMESTAMP) > _CACHE_TTL
            )
            if need_refresh:
                _CATEGORIES_CACHE = Category.query.filter_by(is_active=True).all()
                _CACHE_TIMESTAMP = now
            g.all_categories = _CATEGORIES_CACHE  # dùng cache process-level

        # ✅ THÊM FEATURE FLAGS CONTEXT
        feature_context = get_feature_context()

        return {
            'get_setting': get_setting,
            'site_name': app.config.get('SITE_NAME', 'Briconvn'),
            'all_categories': g.all_categories,
            'current_year': datetime.now().year,
            # Pre-load settings thường dùng
            'default_banner': get_setting('default_banner', ''),
            # Thêm các settings quan trọng cho base.html
            'website_name': get_setting('website_name', 'BRICON VIỆT NAM'),
            'logo_url': get_setting('logo_url', '/static/img/logo.png'),
            'hotline': get_setting('hotline', '0901.180.094'),
            'contact_email': get_setting('contact_email', 'info@bricon.vn'),
            # ✅ Feature Flags - THÊM DÒNG NÀY
            **feature_context  # Spread dict: thêm is_feature_enabled và enabled_features
        }

    # ==================== JINJA2 FILTERS ====================
    @app.template_filter('format_price')
    def format_price(value):
        """Format giá tiền: 1000000 -> 1.000.000"""
        if value:
            return '{:,.0f}'.format(value).replace(',', '.')
        return '0'

    @app.template_filter('nl2br')
    def nl2br_filter(text):
        """Convert newlines to <br> tags"""
        if not text:
            return ''
        return text.replace('\n', '<br>\n')

    # ==================== TIMEZONE FILTERS ====================
    @app.template_filter('vn_datetime')
    def vn_datetime_filter(dt, format='%d/%m/%Y %H:%M:%S'):
        """Chuyển UTC datetime sang múi giờ Việt Nam"""
        if dt is None:
            return ''
        if dt.tzinfo is None:
            dt = pytz.utc.localize(dt)
        vn_dt = dt.astimezone(VN_TZ)
        return vn_dt.strftime(format)

    @app.template_filter('vn_date')
    def vn_date_filter(dt):
        """Chỉ hiển thị ngày"""
        return vn_datetime_filter(dt, '%d/%m/%Y')

    @app.template_filter('vn_time')
    def vn_time_filter(dt):
        """Chỉ hiển thị giờ"""
        return vn_datetime_filter(dt, '%H:%M:%S')

    @app.template_filter('vn_datetime_friendly')
    def vn_datetime_friendly_filter(dt):
        """Hiển thị thời gian dễ đọc: 13/10/2025 lúc 14:30"""
        return vn_datetime_filter(dt, '%d/%m/%Y lúc %H:%M')

    # ==================== ERROR HANDLERS ====================
    @app.errorhandler(404)
    def not_found_error(error):
        from flask import render_template
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        from flask import render_template
        db.session.rollback()
        return render_template('errors/500.html'), 500

    # Render đôi khi trả 502/503 khi cold start/quá tải
    @app.errorhandler(502)
    @app.errorhandler(503)
    def service_unavailable(error):
        from flask import render_template
        return render_template('errors/500.html'), 503

    @app.errorhandler(413)
    def request_entity_too_large(error):
        from flask import render_template, flash, redirect, url_for
        flash('File quá lớn! Kích thước tối đa là 16MB.', 'danger')
        return redirect(url_for('main.index'))

    # ==================== BEFORE/AFTER/TEARDOWN ====================
    @app.before_request
    def before_request():
        """Security checks trước mỗi request"""
        # Force HTTPS in production (nếu đang trên Render)
        if os.getenv('FLASK_ENV') == 'production':
            if not request.is_secure and request.headers.get('X-Forwarded-Proto', 'http') != 'https':
                url = request.url.replace('http://', 'https://', 1)
                return redirect(url, code=301)

    @app.after_request
    def after_request(response):
        """
        ✅ ENHANCED SECURITY HEADERS
        ✅ Performance optimizations
        ✅ SKIP CSP cho admin area (CKEditor cần freedom)
        """

        # # ==================== CACHING ====================
        # if request.path.startswith('/static/'):
        #     response.cache_control.max_age = 600
        #     response.cache_control.public = True
        #     response.cache_control.immutable = True
        #
        # # Cache cho CSS/JS/Images
        # if any(request.path.endswith(ext) for ext in
        #        ['.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.woff', '.woff2']):
        #     response.cache_control.max_age = 600
        #     response.cache_control.public = True

        # ==================== SECURITY HEADERS ====================
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'

        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'

        # XSS Protection
        response.headers['X-XSS-Protection'] = '1; mode=block'

        # Referrer Policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions Policy (disable unnecessary features)
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        # HSTS - chỉ bật khi đã có HTTPS
        if request.is_secure or os.getenv('FLASK_ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        # ✅ KIỂM TRA ADMIN AREA
        is_admin = request.path.startswith('/admin')

        # Content Security Policy (CSP) - CHỈ ÁP DỤNG CHO PUBLIC PAGES
        # Admin area SKIP CSP để CKEditor hoạt động bình thường
        if os.getenv('FLASK_ENV') == 'production' and not is_admin:
            csp_directives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com https://cdnjs.cloudflare.com https://www.google-analytics.com",
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
                "img-src 'self' data: https: http: blob:",
                "connect-src 'self' https://www.google-analytics.com https://res.cloudinary.com",
                "frame-src 'self' https://www.youtube.com https://www.google.com",
                "media-src 'self' https: data:",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
                "upgrade-insecure-requests"
            ]
            response.headers['Content-Security-Policy'] = "; ".join(csp_directives)

        return response

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        """Đảm bảo đóng session sau mỗi request"""
        db.session.remove()

    # ==================== CUSTOM CLI COMMANDS ====================
    @app.cli.command()
    def clear_cache():
        """Clear categories cache"""
        clear_categories_cache()
        print("✅ Cache cleared successfully!")

    @app.cli.command()
    def test_security():
        """Test security headers"""
        with app.test_client() as client:
            response = client.get('/')
            print("\n🔒 Security Headers Check:")
            headers_to_check = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'X-XSS-Protection',
                'Referrer-Policy',
                'Permissions-Policy',
                'Content-Security-Policy'
            ]
            for header in headers_to_check:
                value = response.headers.get(header, '❌ NOT SET')
                print(f"  {header}: {value}")

    return app


# ==================== CLEAR CACHE FUNCTION ====================
def clear_categories_cache():
    """Helper function để clear cache khi cần"""
    global _CATEGORIES_CACHE, _CACHE_TIMESTAMP
    _CATEGORIES_CACHE = None
    _CACHE_TIMESTAMP = None


# ==================== USER LOADER ====================
@login_manager.user_loader
def load_user(user_id):
    """Load user by ID for Flask-Login"""
    from app.models.user import User
    return User.query.get(int(user_id))