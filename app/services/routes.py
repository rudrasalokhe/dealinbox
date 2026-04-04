from flask import Blueprint, render_template, request, redirect, url_for
from flask_login import login_required, current_user
from app import db
from app.models import Service, Booking

bp = Blueprint('services', __name__)

@bp.route('/services')
@login_required
def list_services():
    services=Service.query.filter_by(owner_id=current_user.id).all()
    stats={s.id:Booking.query.filter_by(service_id=s.id).count() for s in services}
    return render_template('services/list.html', services=services, stats=stats)

@bp.route('/services/new', methods=['GET','POST'])
@bp.route('/services/<int:id>/edit', methods=['GET','POST'])
@login_required
def form(id=None):
    s=Service.query.get_or_404(id) if id else None
    if request.method=='POST':
        s=s or Service(owner_id=current_user.id)
        s.name=request.form['name']; s.description=request.form.get('description'); s.price=float(request.form['price']); s.duration_minutes=int(request.form['duration_minutes']); s.category=request.form.get('category')
        db.session.add(s); db.session.commit(); return redirect(url_for('services.list_services'))
    return render_template('services/list.html', services=Service.query.filter_by(owner_id=current_user.id).all(), edit=s, stats={})

@bp.post('/services/<int:id>/toggle')
@login_required
def toggle(id):
    s=Service.query.get_or_404(id); s.is_active=not s.is_active; db.session.commit(); return redirect(url_for('services.list_services'))
