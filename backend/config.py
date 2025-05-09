import os
from dotenv import load_dotenv

# ✅ Load environment variables from .env file
load_dotenv()

class Config:
    # ✅ Secret Key (used for both session and JWT)
    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")

    # ✅ Database Configuration
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///local.db")
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}  # Helps maintain connection
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Email Configuration
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")

    # JWT Configuration
    JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", 30))

    # Cloudinary Configuration (updated to use environment variables)
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # Add these new lines
    SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = True

    # Add to Config class
    CLOUDINARY_BASE_URL = f"https://res.cloudinary.com/{os.getenv('CLOUDINARY_CLOUD_NAME')}"
    CLOUDINARY_UPLOAD_PRESET = os.getenv("CLOUDINARY_UPLOAD_PRESET", "shaol_posts")