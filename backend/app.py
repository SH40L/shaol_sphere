from flask import Flask, render_template, request, jsonify
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
CORS(app)  # Enable CORS for API requests

# ✅ Middleware: Protect Routes Using JWT
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            return f(payload, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

    return decorated

# ✅ Landing Page (Logged-out users only)
@app.route("/")
def home():
    return render_template("index.html")

# ✅ Feed Page (Protected with JWT)
@app.route("/feed")
@token_required
def feed(payload):
    return render_template("feed.html", username=payload.get("email"))

# ✅ Login & Register Pages
@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/register")
def register_page():
    return render_template("register.html")

# ✅ Register authentication routes
app.register_blueprint(auth_bp, url_prefix="/auth")

if __name__ == "__main__":
    app.run(debug=True)
