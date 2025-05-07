# extensions.py
from flask_mail import Mail
import cloudinary
import os  # <-- Add this import at the top

mail = Mail()

# ✅ Cloudinary setup moved into callable function
def configure_cloudinary(app):
    cloudinary.config(
        cloud_name=app.config.get("CLOUDINARY_CLOUD_NAME") or os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=app.config.get("CLOUDINARY_API_KEY") or os.getenv("CLOUDINARY_API_KEY"),
        api_secret=app.config.get("CLOUDINARY_API_SECRET") or os.getenv("CLOUDINARY_API_SECRET"),
        secure=True
    )