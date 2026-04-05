from .auth import auth_bp
from .dashboard import dashboard_bp
from .orders import orders_bp
from .inventory import inventory_bp
from .customers import customers_bp
from .profit import profit_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(profit_bp)
