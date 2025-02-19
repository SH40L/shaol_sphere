from flask import Blueprint, request, jsonify, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message
from database import db
from models import User
from extensions import mail  # Import mail from extensions.py
import secrets

auth_bp = Blueprint("auth", __name__)

# ✅ Function to send verification email
def send_verification_email(user):
    try:
        token = secrets.token_urlsafe(16)  # Generate one-time token
        verification_link = url_for('auth.verify_email', email=user.email, _external=True)

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

        If you didn’t request this, ignore this email.

        Thanks,
        SHAOL Sphere Team
        """
        mail.send(msg)
        return True
    except Exception as e:
        print("Error sending email:", e)
        return False

# ✅ User Registration Route
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        username = data.get("username")
        full_name = data.get("full_name")
        date_of_birth = data.get("date_of_birth")
        gender = data.get("gender")
        email = data.get("email")
        password = data.get("password")

        if not (username and full_name and date_of_birth and gender and email and password):
            return jsonify({"error": "All fields are required"}), 400

        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            return jsonify({"error": "Username or email already exists"}), 400

        hashed_password = generate_password_hash(password)

        new_user = User(
            username=username,
            full_name=full_name,
            date_of_birth=date_of_birth,
            gender=gender,
            email=email,
            password_hash=hashed_password
        )
        db.session.add(new_user)
        db.session.commit()

        # Send verification email
        if send_verification_email(new_user):
            return jsonify({"message": "Registration successful! Please check your email to verify your account."}), 201
        else:
            return jsonify({"error": "Failed to send verification email. Please try again."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Email Verification Route (Updates is_verified)
@auth_bp.route("/verify-email", methods=["GET"])
def verify_email():
    email = request.args.get("email")
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "Invalid verification link"}), 400

    if user.is_verified:
        return jsonify({"message": "Your email is already verified!"}), 200

    user.is_verified = True
    db.session.commit()

    return jsonify({"message": "Email verified successfully!"}), 200

# ✅ User Login Route (Only Verified Users)
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not (email and password):
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        if not user.is_verified:
            return jsonify({"error": "Please verify your email before logging in."}), 403

        if check_password_hash(user.password_hash, password):
            return jsonify({"message": "Login successful!"})
        else:
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500
