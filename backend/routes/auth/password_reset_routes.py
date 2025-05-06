from flask import Blueprint, request, jsonify, render_template, url_for
from werkzeug.security import generate_password_hash
from models import User
from extensions import mail
from flask_mail import Message
from database import db
from .utils import generate_jwt_token
import jwt
from config import Config

password_reset_bp = Blueprint("password_reset", __name__)

# ✅ Render the password reset form
@password_reset_bp.route("/password-reset", methods=["GET"])
def password_reset_page():
    return render_template("password_reset.html")

# ✅ New: Check if reset token is valid (for frontend to verify before showing page)
@password_reset_bp.route("/check-reset-token", methods=["POST"])
def check_reset_token():
    try:
        data = request.json
        token = data.get("token")

        if not token:
            return jsonify({"error": "Token is required"}), 400

        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        user = User.query.filter_by(email=payload["email"]).first()

        if not user or user.password_reset_used or user.password_reset_token != token:
            return jsonify({"error": "This reset link is invalid or has already been used."}), 400

        return jsonify({"message": "Token is valid."}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "This reset link has expired."}), 400
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid reset link."}), 400

# ✅ Handle reset password form submit
@password_reset_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.json
        token = data.get("token")
        new_password = data.get("new_password")
        
        if not token or not new_password:
            return jsonify({"error": "Invalid request"}), 400

        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            user = User.query.filter_by(email=payload["email"]).first()

            if not user:
                return jsonify({"error": "Invalid or expired token"}), 400

            if user.password_reset_used or user.password_reset_token != token:
                return jsonify({"error": "This reset link is invalid or has already been used."}), 400

            user.password_hash = generate_password_hash(new_password)
            user.password_reset_used = True
            user.password_reset_token = None
            db.session.commit()

            return jsonify({"message": "Password reset successful! Please log in."}), 200

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Password reset link has expired."}), 400
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid reset link."}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Password Reset Request Page (form)
@password_reset_bp.route("/password-reset-request", methods=["GET"])
def password_reset_request_page():
    return render_template("password_reset_request.html")

# ✅ Send reset link to user
def send_password_reset_email(user):
    try:
        token = generate_jwt_token(user.email, expiration_minutes=30)
        reset_link = url_for('auth.password_reset.password_reset_page', _external=True) + f"?token={token}"

        user.password_reset_token = token
        user.password_reset_used = False
        db.session.commit()

        msg = Message(
            "Reset Your Password - SHAOL Sphere",
            sender="shaolsphere@gmail.com",
            recipients=[user.email]
        )
        msg.body = f"""
        Hello {user.username},

        You requested a password reset. Click the link below to reset your password:

        {reset_link}

        This link will expire in 30 minutes.

        If you didn’t request this, ignore this email.

        Thanks,
        SHAOL Sphere Team
        """
        mail.send(msg)
        return True
    except Exception as e:
        print("Error sending password reset email:", e)
        return False

# ✅ Request reset link API
@password_reset_bp.route("/password-reset-request", methods=["POST"])
def password_reset_request():
    try:
        data = request.json
        username = data.get("username")
        email = data.get("email")

        if not username or not email:
            return jsonify({"error": "Username and email are required"}), 400

        user = User.query.filter_by(username=username, email=email).first()
        if not user:
            return jsonify({"error": "No matching account found"}), 404

        send_password_reset_email(user)
        return jsonify({"message": "Password reset link has been sent to your email"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
