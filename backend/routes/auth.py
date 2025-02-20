from flask import Blueprint, request, jsonify, url_for, redirect
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message
from database import db
from models import User
from extensions import mail
import secrets

auth_bp = Blueprint("auth", __name__)

# ✅ Function to send verification email with a token
def send_verification_email(user):
    try:
        token = secrets.token_urlsafe(16)  # Generate a unique token
        user.verification_token = token  # Store token in the database
        db.session.commit()

        verification_link = url_for('auth.verify_email', token=token, _external=True)

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
        verification_token = secrets.token_urlsafe(16)  # Generate token

        new_user = User(
            username=username,
            full_name=full_name,
            date_of_birth=date_of_birth,
            gender=gender,
            email=email,
            password_hash=hashed_password,
            verification_token=verification_token  # Save token
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

# ✅ Email Verification Route
@auth_bp.route("/verify-email", methods=["GET"])
def verify_email():
    token = request.args.get("token")
    user = User.query.filter_by(verification_token=token).first()

    if not user:
        return jsonify({"error": "Invalid or expired verification link"}), 400

    if user.is_verified:
        return redirect(url_for('login_page') + "?message=Your email is already verified!&status=info")

    user.is_verified = True
    user.verification_token = None  # Remove token after verification
    db.session.commit()

    return redirect(url_for('login_page') + "?message=Email verified successfully!&status=success")

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