# utils.py
# ✅ Common utility functions for SHAOL Sphere (auth related)

import jwt
import datetime
from config import Config

# ✅ Generate JWT token for email verification & password reset
def generate_jwt_token(email, expiration_minutes=60):
    expiration = datetime.datetime.utcnow() + datetime.timedelta(minutes=expiration_minutes)
    payload = {"email": email, "exp": expiration}
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")
