# profile_routes.py
from flask import Blueprint, render_template, abort, request, jsonify, g, redirect
from models import User, Post, Like, Follower, Comment, Notification
from database import db
from sqlalchemy import func, desc

profile = Blueprint('profile', __name__)

def enrich_post(post, user, current_user):
    """Helper to serialize post data consistently for both profile and feed."""
    comments = Comment.query.filter_by(post_id=post.id).order_by(Comment.created_at).all()
    recent_comment = comments[-1] if comments else None
    original_post = None
    
    if post.shared_from:
        original_post = Post.query.get(post.shared_from)
        if original_post:
            original_user = User.query.get(original_post.user_id)
            original_post = {
                "id": original_post.id,
                "content": original_post.content,
                "media_url": original_post.media_url,
                "created_at": original_post.created_at.strftime('%b %d, %Y'),
                "user": {
                    "username": original_user.username,
                    "full_name": original_user.full_name,
                    "profile_pic": original_user.profile_pic
                }
            }

    return {
        "id": post.id,
        "username": user.username,
        "user_name": user.full_name,
        "user_pic": user.profile_pic,
        "share_count": Post.query.filter_by(shared_from=post.id).count(),
        "content": post.content,
        "media_url": post.media_url,
        "created_at": post.created_at,
        "like_count": Like.query.filter_by(post_id=post.id).count(),
        "liked": Like.query.filter_by(post_id=post.id, user_id=current_user.id).first() is not None,
        "comment_count": len(comments),
        "recent_comment": serialize_comment(recent_comment),
        "shared_from": post.shared_from,
        "original_post": original_post
    }

def serialize_comment(comment):
    if not comment:
        return None
    user = User.query.get(comment.user_id)
    return {
        "user_name": user.full_name,
        "user_pic": user.profile_pic,
        "username": user.username,
        "content": comment.content,
        "created_at": comment.created_at.strftime('%b %d, %H:%M')
    }

@profile.route('/<username>')
def view_profile(username):
    if not g.user:
        return redirect("/")

    user = User.query.filter_by(username=username).first_or_404()
    is_owner = user.id == g.user.id
    is_following = Follower.query.filter_by(
        follower_id=g.user.id, 
        following_id=user.id
    ).first() is not None if not is_owner else False

    # Use offset-based pagination to align with AJAX loading
    offset = request.args.get('offset', 0, type=int)
    limit = 10
    posts = Post.query.filter_by(user_id=user.id)\
        .order_by(Post.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()

    enriched_posts = [enrich_post(post, user, g.user) for post in posts]
    has_more = len(posts) == limit

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({
            'posts_html': render_template(
                'profile_posts.html',
                posts=enriched_posts,
                user=user,
                is_owner=is_owner,
                current_user=g.user
            ),
            'has_more': has_more
        })

    total_likes = db.session.query(func.count(Like.id))\
        .join(Post, Post.id == Like.post_id)\
        .filter(Post.user_id == user.id).scalar()

    return render_template(
        "profile.html",
        user=user,
        posts=enriched_posts,
        is_owner=is_owner,
        is_following=is_following,
        follower_count=Follower.query.filter_by(following_id=user.id).count(),
        post_count=Post.query.filter_by(user_id=user.id).count(),
        following_count=Follower.query.filter_by(follower_id=user.id).count(),
        total_likes=total_likes
    )

@profile.route('/profile/<username>/like-count')
def profile_like_count(username):
    user = User.query.filter_by(username=username).first_or_404()
    count = db.session.query(func.count(Like.id)).join(Post).filter(Post.user_id == user.id).scalar()
    return jsonify({"total_likes": count})

@profile.route('/delete-post/<int:post_id>', methods=['POST'])
def delete_post(post_id):
    if not g.user:
        return jsonify({"success": False})

    post = Post.query.get(post_id)
    if not post or post.user_id != g.user.id:
        return jsonify({"success": False})

    try:
        db.session.query(Comment).filter_by(post_id=post.id).delete()
        db.session.query(Like).filter_by(post_id=post.id).delete()
        db.session.delete(post)
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@profile.route('/follow/<username>', methods=['POST'])
def toggle_follow(username):
    if not g.user:
        return jsonify({"success": False})

    user = User.query.filter_by(username=username).first_or_404()
    if user.id == g.user.id:
        return jsonify({"success": False})

    existing = Follower.query.filter_by(follower_id=g.user.id, following_id=user.id).first()

    if existing:
        db.session.delete(existing)
        following = False
    else:
        db.session.add(Follower(follower_id=g.user.id, following_id=user.id))
        db.session.add(Notification(
            recipient_id=user.id,
            sender_id=g.user.id,
            type="follow"
        ))
        following = True

    db.session.commit()
    follower_count = Follower.query.filter_by(following_id=user.id).count()
    return jsonify({
        "success": True,
        "following": following,
        "follower_count": follower_count
    })

@profile.route('/<username>/posts')
def load_more_profile_posts(username):
    if not g.user:
        return jsonify({"success": False}), 401

    user = User.query.filter_by(username=username).first_or_404()
    is_owner = user.id == g.user.id

    offset = request.args.get('offset', 0, type=int)
    limit = 10

    posts = Post.query.filter_by(user_id=user.id)\
        .order_by(Post.created_at.desc())\
        .offset(offset)\
        .limit(limit + 1)\
        .all()

    has_more = len(posts) > limit
    posts = posts[:limit]

    enriched_posts = [enrich_post(post, user, g.user) for post in posts]

    return jsonify({
        'posts_html': render_template('profile_posts.html', posts=enriched_posts, user=user, is_owner=is_owner, current_user=g.user),
        'has_more': has_more
    })
