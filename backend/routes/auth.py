from flask import Blueprint, request, jsonify, url_for, redirect, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message
from database import db
from models import User
from extensions import mail
import jwt
import datetime
from config import Config

auth_bp = Blueprint("auth", __name__)

# ✅ Generate JWT token for email verification & password reset
def generate_jwt_token(email, expiration_minutes=60):
    expiration = datetime.datetime.utcnow() + datetime.timedelta(minutes=expiration_minutes)
    payload = {"email": email, "exp": expiration}
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

# ✅ Function to send verification email
def send_verification_email(user):
    try:
        token = generate_jwt_token(user.email, expiration_minutes=60)
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

# ✅ Email Verification Route
@auth_bp.route("/verify-email", methods=["GET"])
def verify_email():
    token = request.args.get("token")
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        user = User.query.filter_by(email=payload["email"]).first()

        if not user:
            return jsonify({"error": "Invalid verification link"}), 400

        if user.is_verified:
            return redirect(url_for('login_page') + "?message=Your email is already verified!&status=info")

        user.is_verified = True
        db.session.commit()
        return redirect(url_for('login_page') + "?message=Email verified successfully!&status=success")

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Verification link expired. Please request a new verification email."}), 400
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid verification link"}), 400

# ✅ User Login Route
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not all([email, password]):
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password"}), 401

        if not user.is_verified:
            return jsonify({"error": "Please verify your email before logging in."}), 403

        return jsonify({"message": "Login successful!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Password Reset Request Page
@auth_bp.route("/password-reset-request", methods=["GET"])
def password_reset_request_page():
    return render_template("password_reset_request.html")

# ✅ Function to send password reset email
def send_password_reset_email(user):
    try:
        token = generate_jwt_token(user.email, expiration_minutes=30)
        reset_link = url_for('auth.password_reset', token=token, _external=True)

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

# ✅ Password Reset Request API (Now Checks BOTH Username & Email)
@auth_bp.route("/password-reset-request", methods=["POST"])
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

        token = generate_jwt_token(user.email, expiration_minutes=30)
        reset_link = url_for('auth.password_reset', token=token, _external=True)

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

        return jsonify({"message": "Password reset link has been sent to your email"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Password Reset Page
@auth_bp.route("/password-reset", methods=["GET"])
def password_reset():
    return render_template("password_reset.html")

# ✅ Password Reset API (Fixed Route Name & Added Logging)
@auth_bp.route("/reset-password", methods=["POST"])
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

            user.password_hash = generate_password_hash(new_password)
            db.session.commit()

            return jsonify({"message": "Password reset successful! Please log in."}), 200

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Password reset link has expired"}), 400
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid reset link"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500