# ✅ routes/dashboard/settings_routes.py

from flask import Blueprint, render_template, request, redirect, url_for, jsonify, g, session
from werkzeug.security import check_password_hash, generate_password_hash
from database import db  # ✅ Corrected: use your structure
from models import User
import cloudinary.uploader

settings = Blueprint("settings", __name__)

# ✅ Middleware: Protect Routes Using JWT
@settings.before_request
def restrict_to_logged_in_users():
    if not g.user:
        return redirect(url_for("auth.login"))

# ✅ Route: Render Settings Page
@settings.route("/settings")
def settings_page():
    return render_template("settings.html")

# ✅ Route: Update About Me Info (Full Name, Bio, Location)
@settings.route("/settings/update-info", methods=["POST"])
def update_info():
    full_name = request.form.get("full_name")
    bio = request.form.get("bio")
    location = request.form.get("location")

    user = g.user
    user.full_name = full_name
    user.bio = bio
    user.location = location

    db.session.commit()
    return redirect(url_for("settings.settings_page"))

# ✅ Route: AJAX Password Check
@settings.route("/settings/check-password", methods=["POST"])
def check_password():
    data = request.get_json()
    old_password = data.get("old_password")
    if not old_password:
        return jsonify({"valid": False})

    user = g.user
    is_valid = check_password_hash(user.password_hash, old_password)
    return jsonify({"valid": is_valid})

# ✅ Route: Change Password
@settings.route("/settings/update-password", methods=["POST"])
def update_password():
    old_password = request.form.get("old_password")
    new_password = request.form.get("new_password")
    confirm_password = request.form.get("confirm_password")

    if new_password != confirm_password:
        return redirect(url_for("settings.settings_page"))

    user = g.user
    if not check_password_hash(user.password_hash, old_password):
        return redirect(url_for("settings.settings_page"))

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return redirect(url_for("settings.settings_page"))

# ✅ Route: Upload Profile & Cover Images
@settings.route("/settings/update-images", methods=["POST"])
def update_images():
    profile_file = request.files.get("profile_image")
    cover_file = request.files.get("cover_image")

    user = g.user

    if profile_file:
        result = cloudinary.uploader.upload(profile_file, folder="shaol/profile")
        user.profile_pic = result["secure_url"]

    if cover_file:
        result = cloudinary.uploader.upload(cover_file, folder="shaol/cover")
        user.cover_image = result["secure_url"]

    db.session.commit()
    return redirect(url_for("settings.settings_page"))

# ✅ Route: Delete Account
@settings.route("/settings/delete-account", methods=["POST"])
def delete_account():
    data = request.get_json()
    password = data.get("password")

    user = g.user
    if not check_password_hash(user.password_hash, password):
        return jsonify({"success": False, "message": "Incorrect password."})

    db.session.delete(user)
    db.session.commit()
    session.clear()
    return jsonify({"success": True})
