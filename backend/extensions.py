# extensions.py
from flask_mail import Mail
import cloudinary

mail = Mail()

# ✅ Cloudinary setup moved into callable function
def configure_cloudinary(app):
    cloudinary.config(
        cloud_name=app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=app.config["CLOUDINARY_API_KEY"],
        api_secret=app.config["CLOUDINARY_API_SECRET"],
        secure=True
    )