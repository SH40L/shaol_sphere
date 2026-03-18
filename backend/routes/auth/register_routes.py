from flask import Blueprint, request, jsonify, url_for
from werkzeug.security import generate_password_hash
from database import db
from models import User
from .utils import generate_jwt_token
from datetime import datetime  
import requests
from config import Config

register_bp = Blueprint("register", __name__)

def send_verification_email(user):
    try:
        token = generate_jwt_token(user.email, expiration_minutes=60)
        verification_link = url_for('auth.email_verification.verify_email', token=token, _external=True)

        # ✅ Format the email as HTML for the Google Script
        email_html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Welcome to SHAOL Sphere, {user.username}!</h2>
            <p>Please verify your email to activate your account.</p>
            <p>
                <a href="{verification_link}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email
                </a>
            </p>
            <p><em>This link will expire in 1 hour.</em></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <br>
            <p>Thanks,<br><strong>SHAOL Sphere Team</strong></p>
        </div>
        """

        # ✅ Payload for Google Apps Script
        payload = {
            "to": user.email,
            "subject": "Verify Your Email - SHAOL Sphere",
            "htmlBody": email_html
        }

        # ✅ Send the POST request to the Webhook
        response = requests.post(Config.GOOGLE_SCRIPT_URL, json=payload)
        response_data = response.json()

        if response_data.get("status") == "success":
            return True
        else:
            print("Google Script Error:", response_data)
            return False

    except Exception as e:
        print("Error sending email via webhook:", e)
        return False

@register_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        username = data.get("username", "").strip()
        full_name = data.get("full_name", "").strip()
        date_of_birth_str = data.get("date_of_birth", "").strip()  
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