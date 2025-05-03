from flask import Flask, render_template, redirect, url_for, session
from flask_cors import CORS
from flask_login import LoginManager, login_user
from config import Config
from database import db
from extensions import mail
from models import User
from flask import g, request
import jwt

# ✅ Blueprint Imports
from routes.auth import auth_bp
from routes.dashboard.home_routes import dashboard_bp                 # Handles /
from routes.dashboard.profile_routes import profile                   # Handles /<username>
from routes.dashboard.findfriends_routes import findfriends           # Handles /findfriends
from routes.dashboard.complete_profile_routes import complete_profile # Handles /complete-profile
from routes.dashboard.feed_routes import feed                         # Handles /feed, /post
# from routes.dashboard.notification_routes import notifications       # Optional

# ✅ App Setup
app = Flask(__name__)
app.config.from_object(Config)

# ✅ Initialize Extensions
db.init_app(app)
mail.init_app(app)
CORS(app)

# ✅ Flask-Login Setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login_page"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ✅ Login Page
@app.route("/login")
def login_page():
    if session.get("jwt_token"):
        return redirect("/")
    return render_template("login.html")

# ✅ Register Page
@app.route("/register")
def register_page():
    if session.get("jwt_token"):
        return redirect("/")
    return render_template("register.html")

@app.before_request
def load_user_from_jwt():
    token = session.get("jwt_token")
    g.user = None
    if token:
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            g.user = User.query.filter_by(email=payload.get("email")).first()
        except jwt.ExpiredSignatureError:
            session.pop("jwt_token", None)

# ✅ Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(dashboard_bp)         # Handles /
app.register_blueprint(profile)              # Handles /<username>
app.register_blueprint(findfriends)          # Handles /findfriends
app.register_blueprint(complete_profile)     # Handles /complete-profile
app.register_blueprint(feed)
# app.register_blueprint(notifications)      # Optional: /notifications

# ✅ Run App
if __name__ == "__main__":
    app.run(debug=True)
