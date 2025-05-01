# complete_profile_routes.py

import cloudinary.uploader
from flask import Blueprint, render_template, request, redirect, session
from flask_login import login_user
from models import User
from database import db
from config import Config
import jwt

complete_profile = Blueprint("complete_profile", __name__)

# ✅ Helper: Get current user via JWT
def get_current_user():
    token = session.get("jwt_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        return User.query.filter_by(email=payload.get("email")).first()
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        session.pop("jwt_token", None)
        return None

# ✅ Route: Complete Profile (GET + POST)
@complete_profile.route("/complete-profile", methods=["GET", "POST"])
def setup_profile():
    user = get_current_user()
    if not user:
        print("🚫 No user found in session. Redirecting to login.")
        return redirect("/login")

    if user.profile_completed:
        print("✅ Profile already completed. Redirecting to home.")
        return redirect("/")

    if request.method == "POST":
        if request.form.get("skip"):
            user.profile_completed = True
            db.session.commit()
            login_user(user)
            print("⏭️ User skipped profile setup.")
            return redirect("/")

        bio = request.form.get("bio", "")
        location = request.form.get("location", "")
        profile_pic = request.files.get("profile_pic")
        cover_image = request.files.get("cover_image")

        print("📂 Received profile_pic:", profile_pic)
        print("📂 Received cover_image:", cover_image)

        try:
            if profile_pic:
                print("📤 Uploading profile_pic to Cloudinary...")
                result = cloudinary.uploader.upload(profile_pic, folder="shaol/profiles")
                user.profile_pic = result["secure_url"]
                print("✅ Profile pic uploaded:", user.profile_pic)
        except Exception as e:
            print("🚨 Profile image upload failed:", e)

        try:
            if cover_image:
                print("📤 Uploading cover_image to Cloudinary...")
                result = cloudinary.uploader.upload(cover_image, folder="shaol/covers")
                user.cover_image = result["secure_url"]
                print("✅ Cover image uploaded:", user.cover_image)
        except Exception as e:
            print("🚨 Cover image upload failed:", e)

        user.bio = bio
        user.location = location
        user.profile_completed = True
        db.session.commit()

        login_user(user)
        print("✅ Profile completed and saved.")
        return redirect("/")

    print("📄 Rendering complete_profile.html form.")
    return render_template("complete_profile.html", user=user)
