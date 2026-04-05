import os
from datetime import datetime
from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, render_template, g
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, current_user
from pymongo import ASCENDING, DESCENDING

from dealsinbox.config import config_by_name
from dealsinbox.db import mongo
from dealsinbox.routes import register_blueprints

load_dotenv()

bcrypt = Bcrypt()
login_manager = LoginManager()
login_manager.login_view = "auth.login_page"


class User(UserMixin):
    def __init__(self, doc):
        self.doc = doc
        self.id = str(doc["_id"])
        self.email = doc["email"]
        self.business_name = doc.get("business_name", "")


@login_manager.user_loader
def load_user(user_id):
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        return User(user) if user else None
    except Exception:
        return None


def to_serializable(doc):
    if not doc:
        return doc
    if isinstance(doc, list):
        return [to_serializable(x) for x in doc]
    if isinstance(doc, dict):
        out = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                out[k] = str(v)
            elif isinstance(v, datetime):
                out[k] = v.isoformat()
            else:
                out[k] = v
        return out
    return doc


def create_indexes():
    mongo.db.orders.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    mongo.db.products.create_index([("user_id", ASCENDING), ("sku", ASCENDING)], unique=True)
    mongo.db.users.create_index([("email", ASCENDING)], unique=True)


def create_app():
    env = os.getenv("FLASK_ENV", "development")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    app = Flask(
        __name__,
        template_folder=os.path.join(base_dir, "templates"),
        static_folder=os.path.join(base_dir, "static"),
    )
    app.config.from_object(config_by_name.get(env, config_by_name["development"]))

    CORS(app)
    mongo.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)

    register_blueprints(app)

    @app.context_processor
    def inject_globals():
        return {
            "brand_name": "DealsInbox",
            "tagline": "Your entire D2C business, one inbox",
            "now": datetime.utcnow(),
        }

    @app.before_request
    def attach_user_email():
        g.user_email = current_user.email if current_user.is_authenticated else None

    @app.route("/")
    def home():
        if current_user.is_authenticated:
            return render_template("dashboard.html")
        return render_template("login.html")

    with app.app_context():
        create_indexes()

    app.to_serializable = to_serializable
    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
