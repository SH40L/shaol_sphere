from flask import Blueprint, request, jsonify, g, render_template
from datetime import datetime
from models import db, EmergencyAlert, Follower, Notification
from sqlalchemy import func

emergency = Blueprint("emergency", __name__)

@emergency.route("/emergency-alert", methods=["POST"])
def emergency_alert():
    if not g.user:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    message = data.get("message", "").strip()
    lat = data.get("latitude")
    lon = data.get("longitude")

    if not message or lat is None or lon is None:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    # ✅ Limit: 2 alerts per day
    today = datetime.utcnow().date()
    alert_count = EmergencyAlert.query.filter(
        EmergencyAlert.user_id == g.user.id,
        func.date(EmergencyAlert.created_at) == today
    ).count()

    if alert_count >= 2:
        return jsonify({"success": False, "message": "You can only send 2 alerts per day."}), 403

    # ✅ Save alert
    new_alert = EmergencyAlert(
        user_id=g.user.id,
        message=message,
        latitude=lat,
        longitude=lon,
        created_at=datetime.utcnow()
    )
    db.session.add(new_alert)
    db.session.flush()  # Get ID before commit

    # ✅ Notify all followers
    followers = Follower.query.filter_by(following_id=g.user.id).all()
    for f in followers:
        notif = Notification(
            recipient_id=f.follower_id,
            sender_id=g.user.id,
            alert_id=new_alert.id, #✅ use new column
            type="emergency",
            created_at=datetime.utcnow()
        )
        db.session.add(notif)

    db.session.commit()

    return jsonify({"success": True, "alert_id": new_alert.id})

@emergency.route("/alert/<int:alert_id>")
def view_alert(alert_id):
    alert = EmergencyAlert.query.filter_by(id=alert_id).first()

    if not alert or (datetime.utcnow() - alert.created_at).total_seconds() > 4 * 3600:
        return render_template("404.html"), 404

    return render_template("alert_details.html", alert=alert)
