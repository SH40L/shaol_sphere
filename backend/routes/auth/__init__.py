# __init__.py
# ✅ Collect and combine all authentication related routes

from flask import Blueprint

# Import all small blueprints
from .register_routes import register_bp
from .login_routes import login_bp
from .password_reset_routes import password_reset_bp
from .email_verification_routes import email_verification_bp

# Create main auth blueprint
auth_bp = Blueprint("auth", __name__)

# ✅ Register sub-blueprints inside auth
auth_bp.register_blueprint(register_bp)
auth_bp.register_blueprint(login_bp)
auth_bp.register_blueprint(password_reset_bp)
auth_bp.register_blueprint(email_verification_bp)
