from flask import Flask, render_template, redirect, url_for, session, g, request
from flask_cors import CORS
from flask_login import LoginManager, login_user
from config import Config
from database import db
from extensions import mail, configure_cloudinary
from models import User
import jwt

# ✅ Blueprint Imports
from routes.auth import auth_bp
from routes.dashboard.home_routes import dashboard_bp
from routes.dashboard.profile_routes import profile
from routes.dashboard.findfriends_routes import findfriends
from routes.dashboard.complete_profile_routes import complete_profile
from routes.dashboard.feed_routes import feed
from routes.dashboard.notifications_routes import notifications
from routes.dashboard import search_routes 

# ✅ App Setup
app = Flask(__name__)
app.config.from_object(Config)

# ✅ Initialize Extensions
db.init_app(app)
mail.init_app(app)
CORS(app)
configure_cloudinary(app)

# ✅ Flask-Login Setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))  # Use get() instead of query.get()

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

# ✅ Load User from JWT
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
        except jwt.PyJWTError:  # Add this to catch all JWT errors
            session.pop("jwt_token", None)

# ✅ Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(dashboard_bp)
app.register_blueprint(profile)
app.register_blueprint(findfriends)
app.register_blueprint(complete_profile)
app.register_blueprint(feed)
app.register_blueprint(notifications)
app.register_blueprint(search_routes.search) 

# ✅ Run App
if __name__ == "__main__":
    app.run(debug=True)