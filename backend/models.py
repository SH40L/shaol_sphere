# models.py (final updated)

from datetime import datetime
from database import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    password_reset_used = db.Column(db.Boolean, default=False)  # ✅ already added
    password_reset_token = db.Column(db.String(500), nullable=True)  # ✅ newly added
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
