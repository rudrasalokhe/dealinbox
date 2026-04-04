from flask import Blueprint, render_template, request, redirect, url_for
from flask_login import login_required, current_user
from app import db
from app.models import Staff, Booking

bp = Blueprint('staff', __name__)

@bp.route('/staff')
@login_required
def list_staff():
    members=Staff.query.filter_by(owner_id=current_user.id).all()
    perf={m.id:{'bookings':Booking.query.filter_by(staff_id=m.id).count(),'revenue':sum(b.amount for b in Booking.query.filter_by(staff_id=m.id, paid=True).all())} for m in members}
    return render_template('staff/list.html', staff=members, perf=perf)

@bp.route('/staff/new', methods=['GET','POST'])
@bp.route('/staff/<int:id>/edit', methods=['GET','POST'])
@login_required
def form(id=None):
    s=Staff.query.get_or_404(id) if id else None
    if request.method=='POST':
        s=s or Staff(owner_id=current_user.id)
        s.name=request.form['name']; s.email=request.form.get('email'); s.phone=request.form.get('phone'); s.role=request.form.get('role','staff')
        db.session.add(s); db.session.commit(); return redirect(url_for('staff.list_staff'))
    return render_template('staff/form.html', member=s)

@bp.post('/staff/<int:id>/deactivate')
@login_required
def deactivate(id):
    s=Staff.query.get_or_404(id); s.is_active=False; db.session.commit(); return redirect(url_for('staff.list_staff'))
