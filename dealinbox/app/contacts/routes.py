import csv
from io import StringIO
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import oid, org_filter

bp = Blueprint('contacts', __name__, url_prefix='/contacts')

@bp.route('/', methods=['GET'])
@login_required
def list_contacts():
    return jsonify(list(db.contacts.find(org_filter()).sort('created_at', -1)))

@bp.route('/new', methods=['POST'])
@login_required
def create_contact():
    p = request.get_json() or request.form
    payload={'name':p['name'],'company':p.get('company',''),'mobile':p.get('mobile',''),'email':p.get('email',''),'city':p.get('city',''),'org_id':oid(current_user.org_id),'created_at':datetime.utcnow()}
    rid=db.contacts.insert_one(payload).inserted_id
    return jsonify({'id':str(rid)})

@bp.route('/import', methods=['POST'])
@login_required
def import_csv():
    data = request.files['file'].read().decode('utf-8')
    reader = csv.DictReader(StringIO(data))
    docs=[]
    for r in reader:
        docs.append({'name':r.get('name',''),'company':r.get('company',''),'mobile':r.get('mobile',''),'email':r.get('email',''),'city':r.get('city',''),'org_id':oid(current_user.org_id),'created_at':datetime.utcnow()})
    if docs: db.contacts.insert_many(docs)
    return jsonify({'imported':len(docs)})
