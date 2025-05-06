# routes/dashboard/notifications_routes.py

from flask import Blueprint, render_template, g, jsonify
from models import Notification
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
