from datetime import datetime
from database import db
from flask_login import UserMixin

class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    password_reset_used = db.Column(db.Boolean, default=False)
    password_reset_token = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    profile_pic = db.Column(db.String(255), default="default.jpg")
    cover_image = db.Column(db.String(255), default="default_cover.jpg")
    bio = db.Column(db.String(500), default="")
    location = db.Column(db.String(100), default="")
    profile_completed = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<User {self.username}>"

class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    media_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    shared_from = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=True)

    original_post = db.relationship('Post', remote_side=[id])
    user = db.relationship('User', backref='posts')
    comments = db.relationship('Comment', backref='post', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Post {self.id} by User {self.user_id}>"

    @property
    def comment_count(self):
        return len(self.comments)

    @property
    def like_count(self):
        from models import Like
        return Like.query.filter_by(post_id=self.id).count()

class Follower(db.Model):
    __tablename__ = 'followers'

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    following_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # ✅ Add these 2 lines below
    follower = db.relationship('User', foreign_keys=[follower_id], backref=db.backref('following', cascade="all, delete-orphan"))
    following = db.relationship('User', foreign_keys=[following_id], backref=db.backref('followers', cascade="all, delete-orphan"))

    def __repr__(self):
        return f"<Follow {self.follower_id} -> {self.following_id}>"

class Like(db.Model):
    __tablename__ = 'likes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('likes', cascade="all, delete-orphan"))

    def __repr__(self):
        return f"<Like {self.user_id} on {self.post_id}>"

class Comment(db.Model):
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('comments', cascade="all, delete-orphan"))

    def __repr__(self):
        return f"<Comment by {self.user_id} on Post {self.post_id}>"

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=True)
    alert_id = db.Column(db.Integer, db.ForeignKey('emergency_alerts.id'), nullable=True)
    type = db.Column(db.String(20), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recipient = db.relationship('User', foreign_keys=[recipient_id])
    sender = db.relationship('User', foreign_keys=[sender_id])
    post = db.relationship('Post', backref='notifications', foreign_keys=[post_id])
    alert = db.relationship('EmergencyAlert', backref='notifications', foreign_keys=[alert_id])

class EmergencyAlert(db.Model):
    __tablename__ = 'emergency_alerts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('emergency_alerts', cascade="all, delete-orphan"))

    def __repr__(self):
        return f"<EmergencyAlert by User {self.user_id} at {self.created_at}>"
