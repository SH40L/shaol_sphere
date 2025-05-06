from flask import Blueprint, render_template, abort, request, jsonify, g, redirect
from models import User, Post, Like, Follower, Notification
from database import db
from sqlalchemy import func

profile = Blueprint('profile', __name__)

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

    # Pagination logic
    page = request.args.get('page', 1, type=int)
    per_page = 10
    posts_pagination = Post.query.filter_by(user_id=user.id).order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page)
    posts = posts_pagination.items

    # Efficient likes calculation
    total_likes = db.session.query(func.count(Like.id)).join(Post, Post.id == Like.post_id).filter(Post.user_id == user.id).scalar()

    # For AJAX requests return JSON
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        posts_html = render_template('profile_posts.html', posts=posts)
        return jsonify({
            'posts_html': posts_html,
            'has_more': posts_pagination.has_next
        })

    # Regular request
    follower_count = Follower.query.filter_by(following_id=user.id).count()
    following_count = Follower.query.filter_by(follower_id=user.id).count()

    return render_template(
        "profile.html",
        user=user,
        posts=posts,
        is_owner=is_owner,
        is_following=is_following,
        follower_count=follower_count,
        following_count=following_count,
        total_likes=total_likes,
        next_page=posts_pagination.next_num if posts_pagination.has_next else None
    )

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
        following = False
    else:
        new_follow = Follower(follower_id=g.user.id, following_id=user.id)
        db.session.add(new_follow)
        following = True

        # ✅ Create follow notification (don’t notify self)
        notification = Notification(
            recipient_id=user.id,
            sender_id=g.user.id,
            type="follow"
        )
        db.session.add(notification)

    db.session.commit()

    updated_follower_count = Follower.query.filter_by(following_id=user.id).count()

    return jsonify({
        "success": True,
        "following": following,
        "follower_count": updated_follower_count
    })

@profile.route('/delete-post/<int:post_id>', methods=['POST'])
def delete_post(post_id):
    if not g.user:
        return jsonify({"success": False})

    post = Post.query.get(post_id)
    if not post or post.user_id != g.user.id:
        return jsonify({"success": False})

    db.session.delete(post)
    db.session.commit()
    return jsonify({"success": True})