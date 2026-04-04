from datetime import datetime, date
import bcrypt
from flask_login import UserMixin
from . import db


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, index=True, nullable=False)
    phone = db.Column(db.String(20), index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    business_name = db.Column(db.String(180), nullable=False)
    business_type = db.Column(db.String(60), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    gstin = db.Column(db.String(30))
    plan = db.Column(db.String(20), default='free')
    plan_expires_at = db.Column(db.DateTime)
    razorpay_customer_id = db.Column(db.String(80))
    razorpay_subscription_id = db.Column(db.String(80))
    is_active = db.Column(db.Boolean, default=True)
    onboarding_done = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        except ValueError:
            return False


class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    role = db.Column(db.String(20), default='staff')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), index=True)
    email = db.Column(db.String(120))
    address = db.Column(db.String(255))
    gstin = db.Column(db.String(30))
    total_spent = db.Column(db.Float, default=0)
    visit_count = db.Column(db.Integer, default=0)
    last_visit = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String(80))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), index=True, nullable=False)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'), index=True, nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), index=True, nullable=False)
    date = db.Column(db.Date, index=True, default=date.today)
    time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    status = db.Column(db.String(20), index=True, default='pending')
    amount = db.Column(db.Float, default=0)
    paid = db.Column(db.Boolean, default=False)
    payment_method = db.Column(db.String(20), default='pending')
    notes = db.Column(db.Text)
    reminder_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Invoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), index=True, nullable=False)
    invoice_number = db.Column(db.String(40), unique=True, index=True, nullable=False)
    date = db.Column(db.Date, default=date.today)
    due_date = db.Column(db.Date)
    status = db.Column(db.String(20), index=True, default='draft')
    subtotal = db.Column(db.Float, default=0)
    discount = db.Column(db.Float, default=0)
    gst_rate = db.Column(db.Float, default=0)
    gst_amount = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    paid_amount = db.Column(db.Float, default=0)
    payment_method = db.Column(db.String(20), default='pending')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class InvoiceItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoice.id'), index=True, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    amount = db.Column(db.Float, nullable=False)


class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True, nullable=False)
    category = db.Column(db.String(30), index=True, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, index=True, default=date.today)
    receipt_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True, nullable=False)
    type = db.Column(db.String(30))
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
