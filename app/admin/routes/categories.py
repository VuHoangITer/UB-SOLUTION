"""
📁 Categories Management Routes
Quản lý danh mục sản phẩm

FEATURES:
- CRUD cơ bản: List, Add, Edit, Delete
- Upload ảnh đại diện cho category
- Slug tự động từ tên (slugify)
- Active/Inactive status
- Kiểm tra ràng buộc khi xóa (không xóa nếu có sản phẩm)

FIELDS:
- name: Tên danh mục *
- slug: URL slug * (auto từ name)
- description: Mô tả chi tiết
- image: Ảnh đại diện
- is_active: Hiển thị/ẩn

🔒 Permission: manage_categories

RELATIONSHIPS:
- Category 1-N Products (backref='category')
- Khi xóa category phải kiểm tra products.count()

⚠️ VALIDATION:
- Slug phải unique
- Không xóa category đang có sản phẩm
"""

from flask import render_template, request, flash, redirect, url_for
from app import db
from app.models.product import Category
from app.forms.product import CategoryForm
from app.utils import save_upload_file
from app.decorators import permission_required
from app.admin import admin_bp
from app.models.features import feature_required

# ==================== LIST ====================
@admin_bp.route('/categories')
@permission_required('manage_categories')
@feature_required('products')
def categories():
    """
    📋 Danh sách danh mục
    - Phân trang 20 items/page
    - Sắp xếp theo ngày tạo (mới nhất)
    - Hiển thị số lượng sản phẩm trong mỗi category
    """
    page = request.args.get('page', 1, type=int)
    categories = Category.query.order_by(Category.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    return render_template('admin/danh_muc/categories.html', categories=categories)


# ==================== ADD ====================
@admin_bp.route('/categories/add', methods=['GET', 'POST'])
@permission_required('manage_categories')
@feature_required('products')
def add_category():
    """
    ➕ Thêm danh mục mới

    AUTO PROCESSING:
    - Slug auto-generate từ name nếu để trống
    - Upload ảnh qua save_upload_file()
    """
    form = CategoryForm()

    if form.validate_on_submit():
        image_path = None
        if form.image.data:
            result = save_upload_file(form.image.data, folder='categories')
            image_path = result[0] if isinstance(result, tuple) else result

        category = Category(
            name=form.name.data,
            slug=form.slug.data,
            description=form.description.data,
            image=image_path,
            is_active=form.is_active.data
        )

        db.session.add(category)
        db.session.commit()

        flash('Đã thêm danh mục thành công!', 'success')
        return redirect(url_for('admin.categories'))

    return render_template('admin/danh_muc/category_form.html', form=form, title='Thêm danh mục')


# ==================== EDIT ====================
@admin_bp.route('/categories/edit/<int:id>', methods=['GET', 'POST'])
@permission_required('manage_categories')
@feature_required('products')
def edit_category(id):
    """
    ✏️ Sửa danh mục

    - Load dữ liệu hiện tại vào form
    - Upload ảnh mới sẽ thay thế ảnh cũ
    - Slug có thể edit (nhưng cẩn thận vì ảnh hưởng URL)
    """
    category = Category.query.get_or_404(id)
    form = CategoryForm(obj=category)

    if form.validate_on_submit():
        if form.image.data:
            result = save_upload_file(form.image.data, folder='categories')
            image_path = result[0] if isinstance(result, tuple) else result
            category.image = image_path

        category.name = form.name.data
        category.slug = form.slug.data
        category.description = form.description.data
        category.is_active = form.is_active.data

        db.session.commit()

        flash('Đã cập nhật danh mục thành công!', 'success')
        return redirect(url_for('admin.categories'))

    return render_template('admin/danh_muc/category_form.html', form=form, title='Sửa danh mục')


# ==================== DELETE ====================
@admin_bp.route('/categories/delete/<int:id>')
@permission_required('manage_categories')
@feature_required('products')
def delete_category(id):
    """
    🗑️ Xóa danh mục

    ⚠️ VALIDATION:
    - Kiểm tra category.products.count() > 0
    - Flash error nếu còn sản phẩm
    - Chỉ xóa khi không còn ràng buộc
    """
    category = Category.query.get_or_404(id)

    if category.products.count() > 0:
        flash('Không thể xóa danh mục đang có sản phẩm!', 'danger')
        return redirect(url_for('admin.categories'))

    db.session.delete(category)
    db.session.commit()

    flash('Đã xóa danh mục thành công!', 'success')
    return redirect(url_for('admin.categories'))
