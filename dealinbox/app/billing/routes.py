from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from app import db

bp = Blueprint('billing', __name__)

@bp.route('/billing')
@login_required
def index(): return render_template('billing/index.html')

@bp.post('/billing/upgrade')
@login_required
def upgrade():
    current_user.plan = request.form.get('plan','starter'); db.session.commit(); flash('Plan updated', 'success'); return redirect(url_for('billing.index'))

@bp.post('/billing/cancel')
@login_required
def cancel():
    current_user.plan = 'free'; db.session.commit(); return redirect(url_for('billing.index'))

@bp.post('/billing/webhook')
def webhook(): return {'status':'ok'}
