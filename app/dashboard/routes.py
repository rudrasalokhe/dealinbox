from datetime import date, timedelta
from flask import Blueprint, render_template
from flask_login import login_required, current_user
from sqlalchemy import func
from app.models import Booking, Customer, Invoice, Expense, Service
from app.utils import format_inr

bp = Blueprint('dashboard', __name__)


@bp.route('/dashboard')
@login_required
def index():
    today = date.today()
    revenue = (Booking.query.with_entities(func.coalesce(func.sum(Booking.amount), 0)).filter_by(owner_id=current_user.id, date=today, paid=True).scalar() or 0)
    bookings = Booking.query.filter_by(owner_id=current_user.id, date=today).count()
    pending = (Invoice.query.with_entities(func.coalesce(func.sum(Invoice.total - Invoice.paid_amount), 0)).filter(Invoice.owner_id == current_user.id, Invoice.status.in_(['sent', 'overdue'])).scalar() or 0)
    customers = Customer.query.filter_by(owner_id=current_user.id).count()
    recent = Booking.query.filter_by(owner_id=current_user.id).order_by(Booking.created_at.desc()).limit(10).all()
    upcoming = Booking.query.filter_by(owner_id=current_user.id, date=today).order_by(Booking.time.asc()).all()
    line = []
    for i in range(30):
        d = today - timedelta(days=29-i)
        amt = Booking.query.with_entities(func.coalesce(func.sum(Booking.amount), 0)).filter_by(owner_id=current_user.id, date=d, paid=True).scalar() or 0
        line.append({'d': d.strftime('%d %b'), 'v': float(amt)})
    donut = []
    for s in Service.query.filter_by(owner_id=current_user.id).all():
        donut.append({'label': s.name, 'value': Booking.query.filter_by(owner_id=current_user.id, service_id=s.id).count()})
    expenses = Expense.query.with_entities(func.coalesce(func.sum(Expense.amount), 0)).filter_by(owner_id=current_user.id).scalar() or 0
    return render_template('dashboard/index.html', metrics={'revenue': format_inr(revenue), 'bookings': bookings, 'pending': format_inr(pending), 'customers': customers, 'profit': format_inr(revenue-expenses)}, recent=recent, upcoming=upcoming, line=line, donut=donut)
