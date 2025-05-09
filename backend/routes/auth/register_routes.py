from flask import Blueprint, request, jsonify, url_for
from werkzeug.security import generate_password_hash
from database import db
from models import User
from extensions import mail
from flask_mail import Message
from .utils import generate_jwt_token
from datetime import datetime  # Add at the TOP

register_bp = Blueprint("register", __name__)

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

@register_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        username = data.get("username", "").strip()
        full_name = data.get("full_name", "").strip()
        date_of_birth_str = data.get("date_of_birth", "").strip()  # Renamed for clarity
        gender = data.get("gender", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        # Validate required fields
        if not all([username, full_name, date_of_birth_str, gender, email, password]):
            return jsonify({"error": "All fields are required"}), 400

        # Check for existing user
        if User.query.filter((User.username == username) | (User.email == email)).first():
            return jsonify({"error": "Username or email already exists"}), 400

        # Convert string to date object
        try:
            date_of_birth = datetime.strptime(date_of_birth_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format (use YYYY-MM-DD)"}), 400

        # Create user with proper date type
        new_user = User(
            username=username,
            full_name=full_name,
            date_of_birth=date_of_birth,  # Now a date object
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