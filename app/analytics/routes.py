from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user
from sqlalchemy import func
from app.models import Booking, Expense, Customer

bp = Blueprint('analytics', __name__)

@bp.route('/analytics')
@login_required
def index(): return render_template('analytics/index.html')

@bp.route('/analytics/revenue')
@login_required
def revenue():
    rev = Booking.query.with_entities(func.coalesce(func.sum(Booking.amount),0)).filter_by(owner_id=current_user.id, paid=True).scalar() or 0
    exp = Expense.query.with_entities(func.coalesce(func.sum(Expense.amount),0)).filter_by(owner_id=current_user.id).scalar() or 0
    return jsonify({'revenue':rev,'expenses':exp,'profit':rev-exp})

@bp.route('/analytics/bookings')
@login_required
def bookings():
    total=Booking.query.filter_by(owner_id=current_user.id).count(); cancelled=Booking.query.filter_by(owner_id=current_user.id,status='cancelled').count()
    return jsonify({'total':total,'cancel_rate': (cancelled/total*100) if total else 0})

@bp.route('/analytics/customers')
@login_required
def customers():
    total=Customer.query.filter_by(owner_id=current_user.id).count(); returning=Customer.query.filter(Customer.owner_id==current_user.id, Customer.visit_count>1).count()
    return jsonify({'total':total,'retention_rate': (returning/total*100) if total else 0})
