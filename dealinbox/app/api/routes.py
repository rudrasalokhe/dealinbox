from datetime import datetime
from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import oid

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/charts/revenue-6m')
@login_required
def revenue_6m():
    org_id = oid(current_user.org_id)
    start = datetime(datetime.utcnow().year - (1 if datetime.utcnow().month <= 6 else 0), max(1, datetime.utcnow().month - 5), 1)
    data = list(db.invoices.aggregate([
        {'$match': {'org_id': org_id, 'status': 'paid', 'created_at': {'$gte': start}}},
        {'$group': {'_id': {'$dateToString': {'format': '%Y-%m', 'date': '$created_at'}}, 'revenue': {'$sum': '$total'}}},
        {'$sort': {'_id': 1}}
    ]))
    return jsonify(data)

@bp.route('/razorpay/webhook', methods=['POST'])
def alias_webhook():
    from app.payments.routes import webhook
    return webhook()
