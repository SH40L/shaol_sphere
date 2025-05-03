from flask import Blueprint, render_template, request, session, jsonify
from models import User, Follower
from database import db
import jwt
from config import Config

findfriends = Blueprint("findfriends", __name__)

# ✅ Main Find Friends Page – Render Only, No Users Loaded Here
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

        following_ids = {
            f.following_id for f in Follower.query.filter_by(follower_id=current_user.id).all()
        }

        return render_template(
            "findfriends.html",
            users=[],  # ❌ No users loaded initially
            following_ids=following_ids,
            current_user=current_user,
            users_empty=False
        )

    except jwt.ExpiredSignatureError:
        session.pop("jwt_token", None)
        return render_template("index.html")
    except jwt.InvalidTokenError:
        session.pop("jwt_token", None)
        return render_template("index.html")


# ✅ API: Return Users for Infinite Scroll (random or search)
@findfriends.route("/api/findfriends")
def api_findfriends():
    token = session.get("jwt_token")
    if not token:
        return jsonify([])

    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
        current_user = User.query.filter_by(email=payload["email"]).first()
        if not current_user:
            return jsonify([])

        query = request.args.get("search", "").strip().lower()
        offset = int(request.args.get("offset", 0))
        limit = 12

        users_query = User.query.filter(User.id != current_user.id)

        if query:
            users_query = users_query.filter(
                (User.full_name.ilike(f"%{query}%")) |
                (User.username.ilike(f"%{query}%"))
            ).order_by(User.full_name.asc())
        else:
            users_query = users_query.order_by(db.func.random())

        users = users_query.offset(offset).limit(limit).all()

        following_ids = {
            f.following_id for f in Follower.query.filter_by(follower_id=current_user.id).all()
        }

        return jsonify([
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "bio": u.bio or "No bio available",
                "profile_pic": u.profile_pic if u.profile_pic else "/static/uploads/default.jpg",
                "is_following": u.id in following_ids
            } for u in users
        ])
    except Exception as e:
        print("🔴 API Error:", e)
        return jsonify([])


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
