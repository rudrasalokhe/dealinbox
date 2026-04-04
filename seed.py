from datetime import datetime
import bcrypt
from pymongo import MongoClient
from bson import ObjectId
from config import Config

client = MongoClient(Config.MONGO_URI)
db = client[Config.DB_NAME]

org_id = db.orgs.insert_one({'name': 'Demo Org', 'gst_no': '27ABCDE1234F1Z5', 'city': 'Mumbai', 'industry': 'Services', 'plan': 'pro', 'razorpay_key_id': '', 'razorpay_key_secret': '', 'twilio_sid': '', 'twilio_token': '', 'twilio_whatsapp_number': ''}).inserted_id
u = db.users.insert_one({'email': 'demo@bharatstack.in', 'password_hash': bcrypt.hashpw(b'demo1234', bcrypt.gensalt()).decode(), 'org_id': org_id, 'role': 'admin', 'mobile': '+919999999999', 'verified': True, 'created_at': datetime.utcnow()})
contacts=[]
for i in range(5):
    contacts.append(db.contacts.insert_one({'name': f'Contact {i+1}', 'company': 'Acme', 'mobile': f'+91990000000{i}', 'email': f'c{i}@x.com', 'city': 'Mumbai', 'org_id': org_id, 'created_at': datetime.utcnow()}).inserted_id)
for i in range(10):
    db.deals.insert_one({'title': f'Deal {i+1}', 'value': (i+1)*10000, 'stage': 'Lead' if i<7 else 'Won', 'contact_id': contacts[i%5], 'org_id': org_id, 'assigned_to': str(u.inserted_id), 'source': 'web', 'created_at': datetime.utcnow(), 'updated_at': datetime.utcnow()})
print('Demo login: demo@bharatstack.in / demo1234')
