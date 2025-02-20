from flask import Flask, render_template, request, redirect, url_for, session
from config import Config
from database import db
from extensions import mail
from routes.auth import auth_bp  # Import authentication routes
from sqlalchemy.sql import text

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
mail.init_app(app)

# ✅ Landing Page (Different Views for Logged-in & Logged-out Users)
@app.route("/")
def home():
    if "user_id" in session:
        return redirect(url_for("feed"))  # Redirect logged-in users to feed
    return render_template("index.html")  # Show landing page for logged-out users

# ✅ Feed Page (Only for Logged-in Users)
@app.route("/feed")
def feed():
    if "user_id" not in session:
        return redirect(url_for("home"))  # Redirect if not logged in
    return render_template("feed.html")

# ✅ Login Page Route
@app.route("/login")
def login_page():
    return render_template("login.html")

# ✅ Register Page Route
@app.route("/register")
def register_page():
    return render_template("register.html")

# ✅ Register authentication routes
app.register_blueprint(auth_bp, url_prefix="/auth")

if __name__ == "__main__":
    app.run(debug=True)