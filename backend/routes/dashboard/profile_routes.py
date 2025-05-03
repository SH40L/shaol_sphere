from flask import Blueprint, render_template, abort, request, jsonify, g, redirect
from models import User, Post, Like, Follower
from database import db

profile = Blueprint('profile', __name__)

# ✅ View a user's profile
@profile.route('/<username>')
def view_profile(username):
    if not g.user:
        return redirect("/")

    user = User.query.filter_by(username=username).first()
    if not user:
        abort(404)

    is_owner = user.id == g.user.id
    is_following = False
    if not is_owner:
        is_following = Follower.query.filter_by(
            follower_id=g.user.id, following_id=user.id
        ).first() is not None

    posts = Post.query.filter_by(user_id=user.id).order_by(Post.created_at.desc()).all()

    follower_count = Follower.query.filter_by(following_id=user.id).count()
    following_count = Follower.query.filter_by(follower_id=user.id).count()
    total_likes = sum([Like.query.filter_by(post_id=p.id).count() for p in posts])

    return render_template(
        "profile.html",
        user=user,
        posts=posts,
        is_owner=is_owner,
        is_following=is_following,
        follower_count=follower_count,
        following_count=following_count,
        total_likes=total_likes
    )

# ✅ Follow/Unfollow logic (AJAX from JS)
@profile.route('/follow/<username>', methods=['POST'])
def toggle_follow(username):
    if not g.user:
        return jsonify({"success": False})

    user = User.query.filter_by(username=username).first()
    if not user or user.id == g.user.id:
        return jsonify({"success": False})

    existing = Follower.query.filter_by(
        follower_id=g.user.id, following_id=user.id
    ).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        following = False
    else:
        new_follow = Follower(follower_id=g.user.id, following_id=user.id)
        db.session.add(new_follow)
        db.session.commit()
        following = True

    updated_follower_count = Follower.query.filter_by(following_id=user.id).count()

    return jsonify({
        "success": True,
        "following": following,
        "follower_count": updated_follower_count
    })
