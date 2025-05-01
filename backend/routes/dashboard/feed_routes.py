# routes/dashboard/feed_routes.py

from flask import Blueprint, render_template, request, redirect, url_for, session
from flask_login import current_user, login_required
from models import User, Post, Follower
from database import db
import cloudinary.uploader
import jwt
from config import Config
from datetime import datetime

feed = Blueprint("feed", __name__)

# ✅ Feed Page Route
@feed.route("/feed", methods=["GET"])
@login_required
def feed_page():
    # 🔄 Show posts from followed users + self
    followed_ids = [f.following_id for f in Follower.query.filter_by(follower_id=current_user.id)]
    followed_ids.append(current_user.id)

    posts = Post.query.filter(Post.user_id.in_(followed_ids)).order_by(Post.created_at.desc()).all()

    return render_template("feed.html", user=current_user, posts=posts)


# ✅ Handle New Post Upload
@feed.route("/post", methods=["POST"])
@login_required
def create_post():
    content = request.form.get("caption", "")
    media_file = request.files.get("media")
    media_url = None

    if media_file:
        # 🔁 Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            media_file,
            folder="shaol_posts",
            resource_type="auto"
        )
        media_url = upload_result.get("secure_url")

    # ✅ Save to DB
    post = Post(
        user_id=current_user.id,
        content=content,
        media_url=media_url,
        created_at=datetime.utcnow()
    )
    db.session.add(post)
    db.session.commit()

    return redirect(url_for("feed.feed_page"))
