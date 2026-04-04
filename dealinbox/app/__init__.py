from flask import Flask, redirect, url_for
from flask_login import LoginManager, current_user
from pymongo import MongoClient
from bson import ObjectId
from config import Config
from .models import User

login_manager = LoginManager()
mongo_client = None
db = None


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    global mongo_client, db
    mongo_client = MongoClient(app.config['MONGO_URI'])
    db = mongo_client[app.config['DB_NAME']]

    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    from .auth.routes import bp as auth_bp
    from .dashboard.routes import bp as dashboard_bp
    from .deals.routes import bp as deals_bp
    from .contacts.routes import bp as contacts_bp
    from .invoices.routes import bp as invoices_bp
    from .payments.routes import bp as payments_bp
    from .whatsapp.routes import bp as whatsapp_bp
    from .settings.routes import bp as settings_bp
    from .api.routes import bp as api_bp

    for blueprint in [auth_bp, dashboard_bp, deals_bp, contacts_bp, invoices_bp, payments_bp, whatsapp_bp, settings_bp, api_bp]:
        app.register_blueprint(blueprint)

    @app.route('/')
    def home():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard.index'))
        return redirect(url_for('auth.login'))

    return app


@login_manager.user_loader
def load_user(user_id):
    from . import db
    doc = db.users.find_one({'_id': ObjectId(user_id)})
    return User.from_doc(doc) if doc else None
