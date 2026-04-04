from datetime import date, timedelta
import random
from app import create_app, db
from app.models import User, Service, Staff, Customer, Booking, Invoice, Expense

app = create_app()
names=['Aarav','Vivaan','Aditya','Ishita','Priya','Riya','Kabir','Anaya','Saanvi','Arjun','Neha','Rohit','Kiran','Pooja','Meera','Rakesh','Sneha','Nisha','Manoj','Ankit']

with app.app_context():
    db.drop_all(); db.create_all()
    u=User(name='Priya Sharma', email='demo@bharatstack.in', phone='9876543210', business_name="Priya's Beauty Salon", business_type='Salon', city='Mumbai', plan='starter')
    u.set_password('demo1234'); db.session.add(u); db.session.commit()
    services=[]
    for n,p,d in [('Haircut',499,45),('Facial',1499,60),('Massage',1999,75),('Manicure',799,40),('Hair Spa',1299,50)]:
        s=Service(owner_id=u.id,name=n,price=p,duration_minutes=d,category='Beauty'); db.session.add(s); services.append(s)
    db.session.commit()
    staff=[]
    for n in ['Anita','Kavya','Rina']:
        st=Staff(owner_id=u.id,name=n,role='staff'); db.session.add(st); staff.append(st)
    db.session.commit()
    customers=[]
    for i,n in enumerate(names):
        c=Customer(owner_id=u.id,name=f'{n} Patel',phone=f'98{i:08d}',email=f'{n.lower()}@example.com'); db.session.add(c); customers.append(c)
    db.session.commit()
    for _ in range(50):
        c=random.choice(customers); s=random.choice(services); st=random.choice(staff); dt=date.today()+timedelta(days=random.randint(-20,10))
        b=Booking(owner_id=u.id,customer_id=c.id,staff_id=st.id,service_id=s.id,date=dt,amount=s.price,status=random.choice(['pending','confirmed','completed']),paid=random.choice([True,False]))
        db.session.add(b)
    for i in range(30):
        c=random.choice(customers); subtotal=random.choice([999,1499,2499,3999]); gst=18
        inv=Invoice(owner_id=u.id,customer_id=c.id,invoice_number=f'INV-2026-{i+1:03d}',subtotal=subtotal,discount=0,gst_rate=gst,gst_amount=subtotal*gst/100,total=subtotal*1.18,paid_amount=random.choice([0,subtotal*1.18]),status=random.choice(['paid','sent','overdue']))
        db.session.add(inv)
    for _ in range(15):
        db.session.add(Expense(owner_id=u.id,category=random.choice(['rent','salary','supplies','marketing','utilities','other']),description='Monthly ops',amount=random.choice([1500,3000,8000]),date=date.today()-timedelta(days=random.randint(0,30))))
    db.session.commit()
    print('Seeded demo@bharatstack.in / demo1234')
