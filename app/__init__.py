from flask import Flask, redirect, url_for, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_migrate import Migrate
from flask_wtf import CSRFProtect
from config import Config


db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
csrf = CSRFProtect()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)
    login_manager.login_view = 'auth.login'

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from .auth.routes import bp as auth_bp
    from .dashboard.routes import bp as dashboard_bp
    from .bookings.routes import bp as bookings_bp
    from .invoices.routes import bp as invoices_bp
    from .customers.routes import bp as customers_bp
    from .staff.routes import bp as staff_bp
    from .services.routes import bp as services_bp
    from .expenses.routes import bp as expenses_bp
    from .analytics.routes import bp as analytics_bp
    from .settings.routes import bp as settings_bp
    from .billing.routes import bp as billing_bp
    from .api.routes import bp as api_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(invoices_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(services_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(billing_bp)
    app.register_blueprint(api_bp)

    @app.route('/')
    def root_redirect():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard.index'))
        return render_template('landing.html')

    @app.errorhandler(404)
    def not_found(_):
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def server_error(_):
        return render_template('errors/500.html'), 500

    return app
