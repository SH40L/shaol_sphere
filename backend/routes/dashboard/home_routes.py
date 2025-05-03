# home_routes.py

from flask import Blueprint, render_template, redirect, session
from models import User
from config import Config
import jwt

dashboard_bp = Blueprint("main", __name__)

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

# ✅ Home route → root "/"
@dashboard_bp.route("/")
def home():
    user = get_current_user()

    if not user:
        print("🚫 Not logged in. Showing landing page.")
        return render_template("index.html")

    print("🧪 user.profile_completed =", user.profile_completed)
    if not user.profile_completed:
        print("⚠️ Profile incomplete. Redirecting to complete-profile.")
        return redirect("/complete-profile")

    print("✅ Logged in. Loading feed template.")
    return render_template("feed.html", user=user, current_user=user)
