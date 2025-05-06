from flask import Blueprint, request, jsonify, session, redirect
from werkzeug.security import check_password_hash
from models import User
from .utils import generate_jwt_token

login_bp = Blueprint("login", __name__)

@login_bp.route("/login", methods=["POST"])
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

        token = generate_jwt_token(user.email)
        session['jwt_token'] = token

        redirect_url = "/"
        if not user.profile_completed:
            redirect_url = "/complete-profile"

        return jsonify({
            "message": "Login successful!",
            "token": token,
            "redirect_url": redirect_url
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@login_bp.route("/logout")
def logout():
    session.pop("jwt_token", None)
    return redirect("/")
