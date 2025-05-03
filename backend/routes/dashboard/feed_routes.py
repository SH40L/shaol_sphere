from flask import Blueprint, request, jsonify, g, render_template
from models import Post, User, Follower, Like, Comment
from database import db
from datetime import datetime
import cloudinary.uploader

feed = Blueprint("feed", __name__)

# ✅ POST: Upload new post (image/video + caption)
@feed.route("/post", methods=["POST"])
def create_post():
    if not g.user:
        return jsonify({"success": False}), 401

    content = request.form.get("caption", "").strip()
    media_file = request.files.get("media")
    media_url = None

    if media_file:
        try:
            upload_result = cloudinary.uploader.upload(
                media_file,
                folder="shaol_posts",
                resource_type="auto"
            )
            media_url = upload_result.get("secure_url")
        except Exception as e:
            print("Cloudinary error:", e)
            return jsonify({"success": False, "message": "Upload failed"}), 500

    if not content and not media_url:
        return jsonify({"success": False, "message": "Please enter a caption or select an image/video."}), 400

    new_post = Post(
        user_id=g.user.id,
        content=content,
        media_url=media_url,
        created_at=datetime.utcnow()
    )
    db.session.add(new_post)
    db.session.commit()

    return jsonify({
        "success": True,
        "post": {
            "id": new_post.id,
            "user_name": g.user.full_name,
            "user_pic": g.user.profile_pic,
            "caption": new_post.content,
            "media_url": new_post.media_url,
            "created_at": new_post.created_at.strftime('%b %d, %Y'),
            "like_count": 0,
            "comment_count": 0,
            "liked": False,
            "recent_comment": None,
            "username": g.user.username
        }
    })


# ✅ Load posts (initial + infinite scroll)
# feed_routes.py - Update load_more_posts route
@feed.route("/load-posts")
def load_more_posts():
    if not g.user:
        return jsonify({"success": False}), 401

    try:
        offset = int(request.args.get("offset", 0))
        limit = int(request.args.get("limit", 3))
    except ValueError:
        return jsonify({"success": False, "message": "Invalid offset or limit"}), 400

    following_ids = db.session.query(Follower.following_id).filter_by(follower_id=g.user.id).subquery()

    posts = (
        Post.query.filter((Post.user_id.in_(following_ids)) | (Post.user_id == g.user.id))
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    result = []
    for post in posts:
        user = User.query.get(post.user_id)
        comments = Comment.query.filter_by(post_id=post.id).order_by(Comment.created_at).all()
        comment_count = len(comments)
        recent_comment = comments[-1] if comments else None

        post_data = {
            "id": post.id,
            "user_name": user.full_name,
            "user_pic": user.profile_pic,
            "username": user.username,
            "caption": post.content,
            "media_url": post.media_url,
            "created_at": post.created_at.strftime('%b %d, %Y'),
            "comment_count": comment_count,
            "like_count": Like.query.filter_by(post_id=post.id).count(),
            "liked": Like.query.filter_by(post_id=post.id, user_id=g.user.id).first() is not None,
            "recent_comment": serialize_comment(recent_comment) if recent_comment else None,
            "shared_from": post.shared_from  # Add this line
        }

        # Add original post data if it's a shared post
        if post.shared_from:
            original_post = Post.query.get(post.shared_from)
            if original_post:
                original_user = User.query.get(original_post.user_id)
                post_data["original_post"] = {
                    "id": original_post.id,
                    "user_name": original_user.full_name,
                    "user_pic": original_user.profile_pic,
                    "username": original_user.username,
                    "content": original_post.content,
                    "media_url": original_post.media_url,
                    "created_at": original_post.created_at.strftime('%b %d, %Y')
                }

        result.append(post_data)

    return jsonify({"success": True, "posts": result})


# ✅ Like/Unlike Post
@feed.route("/like-post", methods=["POST"])
def like_post():
    if not g.user:
        return jsonify({"success": False}), 401

    data = request.json
    post_id = data.get("post_id")

    post = Post.query.get(post_id)
    if not post:
        return jsonify({"success": False, "message": "Post not found"}), 404

    existing_like = Like.query.filter_by(post_id=post_id, user_id=g.user.id).first()

    if existing_like:
        db.session.delete(existing_like)
        liked = False
    else:
        new_like = Like(post_id=post_id, user_id=g.user.id)
        db.session.add(new_like)
        liked = True

    db.session.commit()
    like_count = Like.query.filter_by(post_id=post_id).count()

    return jsonify({"success": True, "liked": liked, "like_count": like_count})


# ✅ Comment on Post
@feed.route("/comment-post", methods=["POST"])
def comment_post():
    if not g.user:
        return jsonify({"success": False}), 401

    data = request.json
    post_id = data.get("post_id")
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"success": False, "message": "Comment cannot be empty"}), 400

    post = Post.query.get(post_id)
    if not post:
        return jsonify({"success": False, "message": "Post not found"}), 404

    new_comment = Comment(
        post_id=post_id,
        user_id=g.user.id,
        content=content,
        created_at=datetime.utcnow()
    )
    db.session.add(new_comment)
    db.session.commit()

    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at).all()
    comment_count = len(comments)
    recent_comment = comments[-1] if comments else None

    return jsonify({
        "success": True,
        "your_comment": serialize_comment(new_comment),
        "recent_comment": serialize_comment(recent_comment) if recent_comment else None,
        "comment_count": comment_count
    })

# ✅ Share a Post
@feed.route("/share-post", methods=["POST"])
def share_post():
    if not g.user:
        return jsonify({"success": False}), 401

    data = request.json
    original_post_id = data.get("original_post_id")
    message = data.get("message", "").strip()

    original_post = Post.query.get(original_post_id)
    if not original_post:
        return jsonify({"success": False, "message": "Original post not found"}), 404

    # Create shared post
    shared_post = Post(
        user_id=g.user.id,
        content=message,
        media_url=None,
        shared_from=original_post.id,
        created_at=datetime.utcnow()
    )
    db.session.add(shared_post)
    db.session.commit()

    # Get original post author
    original_user = User.query.get(original_post.user_id)

    return jsonify({
        "success": True,
        "post": {
            "id": shared_post.id,
            "user_name": g.user.full_name,
            "user_pic": g.user.profile_pic,
            "caption": shared_post.content,
            "created_at": shared_post.created_at.strftime('%b %d, %Y'),
            "like_count": 0,
            "comment_count": 0,
            "liked": False,
            "recent_comment": None,
            "username": g.user.username,
            "shared_from": original_post.id,
            "original_post": {
                "id": original_post.id,
                "user_name": original_user.full_name,
                "user_pic": original_user.profile_pic,
                "username": original_user.username,
                "content": original_post.content,
                "media_url": original_post.media_url,
                "created_at": original_post.created_at.strftime('%b %d, %Y')
            }
        }
    })


# ✅ Helper: Serialize comment object
def serialize_comment(comment):
    if not comment:
        return None
    user = User.query.get(comment.user_id)
    return {
        "user_name": user.full_name,
        "user_pic": user.profile_pic,
        "username": user.username,
        "content": comment.content,
        "created_at": comment.created_at.strftime('%b %d, %Y')
    }
