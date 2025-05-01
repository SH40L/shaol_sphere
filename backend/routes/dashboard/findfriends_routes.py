from flask import Blueprint, render_template, request, session, jsonify
from models import User, Follower
from database import db
import jwt
from config import Config

findfriends = Blueprint("findfriends", __name__)

# ✅ Show Find Friends Page
@findfriends.route("/findfriends")
def find_friends():
    token = session.get("jwt_token")
    if not token:
        return render_template("index.html")  # redirect to landing page

    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        current_user = User.query.filter_by(email=payload["email"]).first()
        if not current_user:
            return render_template("index.html")

        # ✅ Fix: Match JS query param "search" instead of "q"
        query = request.args.get("search", "").lower()

        users_query = User.query.filter(User.id != current_user.id)
        if query:
            users_query = users_query.filter(
                (User.full_name.ilike(f"%{query}%")) |
                (User.username.ilike(f"%{query}%"))
            )

        # ✅ Do NOT filter out missing fields anymore
        users = users_query.all()

        following_ids = {
            f.following_id for f in Follower.query.filter_by(follower_id=current_user.id).all()
        }

        return render_template(
            "findfriends.html",
            users=users,
            following_ids=following_ids,
            current_user=current_user,
            users_empty=len(users) == 0
        )

    except jwt.ExpiredSignatureError:
        session.pop("jwt_token", None)
        return render_template("index.html")
    except jwt.InvalidTokenError:
        session.pop("jwt_token", None)
        return render_template("index.html")


# ✅ Follow User
@findfriends.route("/follow/<int:user_id>", methods=["POST"])
def follow_user(user_id):
    token = session.get("jwt_token")
    if not token:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        current_user = User.query.filter_by(email=payload["email"]).first()

        if not current_user or current_user.id == user_id:
            return jsonify({"success": False})

        already = Follower.query.filter_by(follower_id=current_user.id, following_id=user_id).first()
        if not already:
            new_follow = Follower(follower_id=current_user.id, following_id=user_id)
            db.session.add(new_follow)
            db.session.commit()

        return jsonify({"success": True})

    except:
        return jsonify({"success": False})


# ✅ Unfollow User
@findfriends.route("/unfollow/<int:user_id>", methods=["POST"])
def unfollow_user(user_id):
    token = session.get("jwt_token")
    if not token:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        current_user = User.query.filter_by(email=payload["email"]).first()

        if not current_user:
            return jsonify({"success": False})

        follow = Follower.query.filter_by(follower_id=current_user.id, following_id=user_id).first()
        if follow:
            db.session.delete(follow)
            db.session.commit()

        return jsonify({"success": True})

    except:
        return jsonify({"success": False})
