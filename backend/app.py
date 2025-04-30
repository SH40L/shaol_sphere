from flask import Flask, render_template, redirect, url_for, session, request, jsonify
from flask_cors import CORS
from config import Config
from database import db
from extensions import mail
from routes.auth import auth_bp
import jwt
from functools import wraps

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
mail.init_app(app)
CORS(app)

# ✅ Middleware: Protect Routes Using JWT
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = session.get("jwt_token")
        if not token:
            return redirect(url_for('login_page'))
        
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            return f(payload, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            session.pop("jwt_token", None)
            return redirect(url_for('login_page'))
        except jwt.InvalidTokenError:
            session.pop("jwt_token", None)
            return redirect(url_for('login_page'))

    return decorated

# ✅ Landing Page (public)
@app.route("/")
def home():
    return render_template("index.html")

# ✅ Feed Page (only for logged-in users)
@app.route("/feed")
@token_required
def feed(payload):
    return render_template("feed.html", username=payload.get("email"))

# ✅ Login Page (redirect if already logged in)
@app.route("/login")
def login_page():
    if session.get("jwt_token"):
        return redirect(url_for('feed'))
    return render_template("login.html")

# ✅ Register Page (redirect if already logged in)
@app.route("/register")
def register_page():
    if session.get("jwt_token"):
        return redirect(url_for('feed'))
    return render_template("register.html")

# ✅ Register authentication routes
app.register_blueprint(auth_bp, url_prefix="/auth")

if __name__ == "__main__":
    app.run(debug=True)
