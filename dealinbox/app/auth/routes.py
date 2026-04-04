import random
import bcrypt
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required
from bson import ObjectId
from twilio.rest import Client
from app import db
from app.models import User
from config import Config

bp = Blueprint('auth', __name__, url_prefix='/auth')


def _send_otp(mobile, otp):
    if not (Config.TWILIO_ACCOUNT_SID and Config.TWILIO_AUTH_TOKEN and Config.TWILIO_SMS_NUMBER):
        return
    client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
    client.messages.create(body=f'Your BharatStack OTP is {otp}', from_=Config.TWILIO_SMS_NUMBER, to=mobile)


@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        org = {
            'name': request.form['org_name'], 'gst_no': request.form.get('gst_no', ''), 'city': request.form.get('city', ''), 'industry': request.form.get('industry', ''), 'plan': 'free',
            'razorpay_key_id': '', 'razorpay_key_secret': '', 'twilio_sid': '', 'twilio_token': '', 'twilio_whatsapp_number': ''
        }
        org_id = db.orgs.insert_one(org).inserted_id
        user_doc = {
            'email': request.form['email'].lower(),
            'password_hash': bcrypt.hashpw(request.form['password'].encode(), bcrypt.gensalt()).decode(),
            'org_id': org_id, 'role': 'admin', 'mobile': request.form['mobile'], 'verified': False, 'created_at': datetime.utcnow()
        }
        user_id = db.users.insert_one(user_doc).inserted_id
        otp = str(random.randint(100000, 999999))
        session['otp'] = otp; session['otp_user_id'] = str(user_id)
        _send_otp(request.form['mobile'], otp)
        flash('OTP sent to mobile', 'info')
        return redirect(url_for('auth.verify_otp'))
    return render_template('auth/register.html')


@bp.route('/verify-otp', methods=['GET', 'POST'])
def verify_otp():
    if request.method == 'POST':
        if request.form['otp'] == session.get('otp'):
            db.users.update_one({'_id': ObjectId(session['otp_user_id'])}, {'$set': {'verified': True}})
            user = db.users.find_one({'_id': ObjectId(session['otp_user_id'])})
            login_user(User.from_doc(user))
            flash('Mobile verified', 'success')
            return redirect(url_for('dashboard.index'))
        flash('Invalid OTP', 'error')
    return render_template('auth/verify_otp.html')


@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = db.users.find_one({'email': request.form['email'].lower()})
        if user and bcrypt.checkpw(request.form['password'].encode(), user['password_hash'].encode()):
            login_user(User.from_doc(user)); return redirect(url_for('dashboard.index'))
        flash('Invalid credentials', 'error')
    return render_template('auth/login.html')


@bp.route('/logout')
@login_required
def logout():
    logout_user(); return redirect(url_for('auth.login'))
