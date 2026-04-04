from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User, Service, Staff

bp = Blueprint('auth', __name__)


@bp.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        if User.query.filter_by(email=request.form['email']).first():
            flash('Email already exists', 'error')
            return redirect(url_for('auth.signup'))
        u = User(
            name=request.form['name'], business_name=request.form['business_name'], business_type=request.form['business_type'], city=request.form['city'],
            email=request.form['email'], phone=request.form['phone'], plan='free'
        )
        u.set_password(request.form['password'])
        db.session.add(u)
        db.session.commit()
        login_user(u)
        return redirect(url_for('auth.onboarding'))
    return render_template('auth/signup.html')


@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(email=request.form['email']).first()
        if user and user.check_password(request.form['password']):
            login_user(user, remember=bool(request.form.get('remember')))
            return redirect(url_for('dashboard.index'))
        flash('Invalid credentials', 'error')
    return render_template('auth/login.html')


@bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))


@bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        flash('Password reset link flow initialized (configure mail in production).', 'info')
    return render_template('auth/login.html')


@bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    flash(f'Reset token accepted: {token}', 'info')
    return redirect(url_for('auth.login'))


@bp.route('/onboarding', methods=['GET', 'POST'])
@login_required
def onboarding():
    if request.method == 'POST':
        step = request.form.get('step')
        if step == 'service':
            db.session.add(Service(owner_id=current_user.id, name=request.form['name'], description='', price=float(request.form['price']), duration_minutes=int(request.form['duration']), category='General'))
        elif step == 'staff':
            db.session.add(Staff(owner_id=current_user.id, name=request.form['name'], email=request.form.get('email'), phone=request.form.get('phone'), role='staff'))
            current_user.onboarding_done = True
        db.session.commit()
        if current_user.onboarding_done:
            return redirect(url_for('dashboard.index'))
    return render_template('auth/onboarding.html')
