# register_routes.py
# ✅ Handles User Registration and Verification Email Sending

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database import db
from models import User
from extensions import mail
from flask_mail import Message
from .utils import generate_jwt_token
from flask import url_for

register_bp = Blueprint("register", __name__)

# ✅ Function to send verification email
def send_verification_email(user):
    try:
        token = generate_jwt_token(user.email, expiration_minutes=60)
        verification_link = url_for('auth.email_verification.verify_email', token=token, _external=True)

        msg = Message(
            "Verify Your Email - SHAOL Sphere",
            sender="shaolsphere@gmail.com",
            recipients=[user.email]
        )
        msg.body = f"""
        Hello {user.username},

        Welcome to SHAOL Sphere! Please verify your email to activate your account.

        Click the link below to verify:
        {verification_link}

        This link will expire in 1 hour.

        If you didn’t request this, ignore this email.

        Thanks,
        SHAOL Sphere Team
        """
        mail.send(msg)
        return True
    except Exception as e:
        print("Error sending email:", e)
        return False

# ✅ Registration Route
@register_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        username = data.get("username")
        full_name = data.get("full_name")
        date_of_birth = data.get("date_of_birth")
        gender = data.get("gender")
        email = data.get("email")
        password = data.get("password")

        if not all([username, full_name, date_of_birth, gender, email, password]):
            return jsonify({"error": "All fields are required"}), 400

        if User.query.filter((User.username == username) | (User.email == email)).first():
            return jsonify({"error": "Username or email already exists"}), 400

        new_user = User(
            username=username,
            full_name=full_name,
            date_of_birth=date_of_birth,
            gender=gender,
            email=email,
            password_hash=generate_password_hash(password),
            is_verified=False
        )
        db.session.add(new_user)
        db.session.commit()

        if send_verification_email(new_user):
            return jsonify({"message": "Registration successful! Please check your email to verify your account."}), 201
        else:
            return jsonify({"error": "Failed to send verification email. Please try again."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500
