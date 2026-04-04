from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app import db
from app.models import Booking, Customer, Staff, Service

bp = Blueprint('bookings', __name__)


@bp.route('/bookings')
@login_required
def list_bookings():
    q = Booking.query.filter_by(owner_id=current_user.id)
    if request.args.get('status'):
        q = q.filter_by(status=request.args['status'])
    bookings = q.order_by(Booking.date.desc()).paginate(page=request.args.get('page', 1, type=int), per_page=20)
    return render_template('bookings/list.html', bookings=bookings)


@bp.route('/bookings/calendar')
@login_required
def calendar():
    bookings = Booking.query.filter_by(owner_id=current_user.id).all()
    return render_template('bookings/calendar.html', bookings=bookings)


@bp.route('/bookings/new', methods=['GET', 'POST'])
@bp.route('/bookings/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def form(id=None):
    booking = Booking.query.get_or_404(id) if id else None
    if request.method == 'POST':
        b = booking or Booking(owner_id=current_user.id)
        b.customer_id = int(request.form['customer_id']); b.staff_id = int(request.form['staff_id']); b.service_id = int(request.form['service_id'])
        dt = datetime.strptime(request.form['datetime'], '%Y-%m-%dT%H:%M')
        b.date, b.time = dt.date(), dt.time(); b.end_time = (dt + timedelta(minutes=int(request.form.get('duration', 60)))).time()
        b.amount = float(request.form['amount']); b.status = request.form.get('status', 'pending'); b.paid = bool(request.form.get('paid')); b.notes = request.form.get('notes', '')
        db.session.add(b); db.session.commit(); flash('Booking saved', 'success')
        return redirect(url_for('bookings.list_bookings'))
    return render_template('bookings/form.html', booking=booking, customers=Customer.query.filter_by(owner_id=current_user.id).all(), staff=Staff.query.filter_by(owner_id=current_user.id).all(), services=Service.query.filter_by(owner_id=current_user.id).all())


@bp.route('/bookings/<int:id>')
@login_required
def detail(id):
    return render_template('bookings/detail.html', booking=Booking.query.get_or_404(id))


def _change(id, status):
    b = Booking.query.get_or_404(id); b.status = status; db.session.commit(); flash(f'Booking {status}', 'success')
    return redirect(url_for('bookings.detail', id=id))


@bp.post('/bookings/<int:id>/confirm')
@login_required
def confirm(id): return _change(id, 'confirmed')


@bp.post('/bookings/<int:id>/complete')
@login_required
def complete(id):
    b = Booking.query.get_or_404(id); b.status = 'completed'; b.paid = True; db.session.commit(); flash('Booking completed', 'success')
    return redirect(url_for('bookings.detail', id=id))


@bp.post('/bookings/<int:id>/cancel')
@login_required
def cancel(id): return _change(id, 'cancelled')


@bp.post('/bookings/<int:id>/remind')
@login_required
def remind(id):
    b = Booking.query.get_or_404(id); b.reminder_sent = True; db.session.commit(); flash('WhatsApp reminder queued', 'success')
    return redirect(url_for('bookings.detail', id=id))
