# routes/dashboard/notifications_routes.py

from flask import Blueprint, render_template, g, jsonify, redirect, url_for
from models import Notification, Post, User
from database import db
from datetime import datetime

notifications = Blueprint("notifications", __name__)

@notifications.route("/notifications")
def view_notifications():
    if not g.user:
        return "Unauthorized", 403

    notes = (
        Notification.query
        .filter_by(recipient_id=g.user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )

    return render_template("notifications.html", notifications=notes)

@notifications.route("/notifications/mark-as-read/<int:nid>")
def mark_as_read(nid):
    if not g.user:
        return "Unauthorized", 403

    note = Notification.query.get(nid)
    if note and note.recipient_id == g.user.id:
        note.is_read = True
        db.session.commit()

        # ✅ Determine redirection path
        if note.type in ['like', 'comment']:
            return redirect(url_for('feed.view_full_post', post_id=note.post_id))
        
        elif note.type == 'share':
            # Redirect to the shared post made by the sender
            shared_post = Post.query.filter_by(shared_from=note.post_id, user_id=note.sender_id).first()
            if shared_post:
                return redirect(url_for('feed.view_full_post', post_id=shared_post.id))
            else:
                return redirect(url_for('feed.view_full_post', post_id=note.post_id))  # fallback

        elif note.type == 'follow':
            user = User.query.get(note.sender_id)
            if user:
                return redirect(f"/{user.username}")

    return redirect(url_for("notifications.view_notifications"))

@notifications.route("/notifications/mark-all-read", methods=["POST"])
def mark_all_as_read():
    if not g.user:
        return jsonify({"success": False}), 403

    Notification.query.filter_by(recipient_id=g.user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"success": True})

@notifications.route("/notifications/unread-count")
def unread_count():
    if not g.user:
        return jsonify({"count": 0})
    count = Notification.query.filter_by(recipient_id=g.user.id, is_read=False).count()
    return jsonify({"count": count})
