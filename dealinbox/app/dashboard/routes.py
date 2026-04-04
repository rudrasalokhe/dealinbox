from datetime import datetime
from flask import Blueprint, render_template
from flask_login import login_required, current_user
from app import db
from app.models import oid

bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')


@bp.route('/')
@login_required
def index():
    org_id = oid(current_user.org_id)
    month_start = datetime(datetime.utcnow().year, datetime.utcnow().month, 1)
    revenue_pipe = [
        {'$match': {'org_id': org_id, 'status': 'paid', 'created_at': {'$gte': month_start}}},
        {'$group': {'_id': None, 'amount': {'$sum': '$total'}}}
    ]
    revenue = next(db.invoices.aggregate(revenue_pipe), {'amount': 0})['amount']
    pipeline_value = next(db.deals.aggregate([{'$match': {'org_id': org_id, 'stage': {'$ne': 'Lost'}}}, {'$group': {'_id': None, 'v': {'$sum': '$value'}}}]), {'v': 0})['v']
    won = db.deals.count_documents({'org_id': org_id, 'stage': 'Won'})
    lost = db.deals.count_documents({'org_id': org_id, 'stage': 'Lost'})
    conversion = round((won / (won + lost) * 100), 2) if (won + lost) else 0
    return render_template('dashboard/index.html', revenue=revenue, pipeline_value=pipeline_value, conversion=conversion)
