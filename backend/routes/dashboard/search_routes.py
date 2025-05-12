# routes/dashboard/search_routes.py

from flask import Blueprint, render_template, request, g
from models import Post, User, Follower, Comment
from database import db
from sqlalchemy.orm import joinedload

search = Blueprint("search", __name__)

@search.route("/search")
def search_posts():
    if not g.user:
        return "Unauthorized", 403

    query = request.args.get("query", "").strip().lower()
    if not query:
        return render_template("search.html", posts=[], query="")

    # Get list of user IDs: self + following
    following_ids = db.session.query(Follower.following_id).filter_by(follower_id=g.user.id).subquery()

    posts = (
        Post.query
        .filter(
            (Post.user_id.in_(following_ids)) | (Post.user_id == g.user.id),
            Post.content.ilike(f"%{query}%")
        )
        .order_by(Post.created_at.desc())
        .all()
    )

    # Sort by full match > partial match
    full_matches = [p for p in posts if p.content.lower() == query]
    partial_matches = [p for p in posts if p.content.lower() != query]
    sorted_posts = full_matches + partial_matches

    # Add recent comment manually
    for post in sorted_posts:
        recent_comment = (
            Comment.query
            .filter_by(post_id=post.id)
            .order_by(Comment.created_at.desc())
            .first()
        )
        if recent_comment:
            post.recent_comment = {
                "content": recent_comment.content,
                "user_name": recent_comment.user.full_name,
                "username": recent_comment.user.username,
                "user_pic": recent_comment.user.profile_pic,
            }
        else:
            post.recent_comment = None

    return render_template("search.html", posts=sorted_posts, query=query)