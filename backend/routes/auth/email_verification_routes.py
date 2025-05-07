# email_verification_routes.py
# ✅ Handles Email Verification After Registration

from flask import Blueprint, request, redirect, url_for
from models import User
from database import db
import jwt
from config import Config

email_verification_bp = Blueprint("email_verification", __name__)

# ✅ Email Verification Route
@email_verification_bp.route("/verify-email", methods=["GET"])
def verify_email():
    token = request.args.get("token")
    try:
        payload = jwt.decode(
            token, 
            Config.SECRET_KEY, 
            algorithms=["HS256"], 
            options={"require_exp": True}  # ✅ Proper placement
        )
        user = User.query.filter_by(email=payload["email"]).first()

        if not user:
            return redirect(url_for('login_page') + "?message=Invalid verification link&status=error")

        if user.is_verified:
            return redirect(url_for('login_page') + "?message=Your email is already verified!&status=info")

        user.is_verified = True
        db.session.commit()
        return redirect(url_for('login_page') + "?message=Email verified successfully!&status=success")

    except jwt.ExpiredSignatureError:
        return redirect(url_for('login_page') + "?message=Verification link expired. Please request a new verification email.&status=error")
    except jwt.InvalidTokenError:
        return redirect(url_for('login_page') + "?message=Invalid verification link&status=error")
