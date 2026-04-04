from datetime import date
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import Booking, Customer, Staff

bp = Blueprint('api', __name__)

@bp.post('/api/bookings')
@login_required
def create_booking():
    data = request.get_json() or {}
    b = Booking(owner_id=current_user.id, customer_id=data['customer_id'], staff_id=data['staff_id'], service_id=data['service_id'], date=date.fromisoformat(data['date']), amount=data.get('amount',0))
    db.session.add(b); db.session.commit()
    return jsonify({'id':b.id})

@bp.get('/api/customers/search')
@login_required
def customer_search():
    q = request.args.get('q','')
    rows = Customer.query.filter(Customer.owner_id==current_user.id, Customer.name.ilike(f'%{q}%')).limit(10).all()
    return jsonify([{'id':c.id,'name':c.name,'phone':c.phone} for c in rows])

@bp.get('/api/staff/availability')
@login_required
def availability():
    datev=request.args.get('date')
    return jsonify([{'staff_id':s.id,'name':s.name,'available':True,'date':datev} for s in Staff.query.filter_by(owner_id=current_user.id, is_active=True).all()])

@bp.post('/api/whatsapp/send')
@login_required
def whatsapp_send():
    return jsonify({'queued': True, 'message': 'WhatsApp queued'})
