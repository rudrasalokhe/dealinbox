import os
import random
from datetime import datetime, timedelta
from bson import ObjectId
from faker import Faker
from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import generate_password_hash

load_dotenv()
fake = Faker("en_IN")

CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai"]
CATEGORIES = ["skincare", "supplements", "clothing", "home decor", "snacks"]
STATUSES = ["pending", "shipped", "delivered", "returned", "cancelled"]


def main():
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/dealsinbox")
    client = MongoClient(uri)
    db = client.get_default_database() if client.get_default_database() else client["dealsinbox"]

    db.users.delete_many({})
    db.products.delete_many({})
    db.orders.delete_many({})

    user = {
        "email": "demo@dealsinbox.in",
        "password_hash": generate_password_hash("demo1234"),
        "business_name": "Demo D2C Pvt Ltd",
        "created_at": datetime.utcnow(),
    }
    user_id = db.users.insert_one(user).inserted_id

    products = []
    for i in range(25):
        cp = random.randint(120, 1500)
        sp = random.randint(299, 2999)
        products.append({
            "user_id": user_id,
            "sku": f"SKU-{i+1:03d}",
            "name": f"{fake.word().title()} {random.choice(['Kit','Pack','Combo','Bottle'])}",
            "category": random.choice(CATEGORIES),
            "cost_price": float(cp),
            "selling_price": float(max(cp + 50, sp)),
            "stock_count": random.randint(0, 120),
            "low_stock_threshold": 10,
            "created_at": datetime.utcnow(),
        })
    db.products.insert_many(products)

    product_ids = list(db.products.find({"user_id": user_id}))
    customers = [(fake.name(), fake.phone_number()[:10], random.choice(CITIES)) for _ in range(10)]

    orders = []
    for i in range(100):
        p = random.choice(product_ids)
        cname, cphone, ccity = random.choice(customers)
        qty = random.randint(1, 4)
        created_at = datetime.utcnow() - timedelta(days=random.randint(0, 30))
        orders.append({
            "user_id": user_id,
            "order_number": f"DI-{2026000 + i}",
            "customer_name": cname,
            "customer_phone": cphone,
            "customer_city": ccity,
            "product_id": p["_id"],
            "product_name": p["name"],
            "quantity": qty,
            "selling_price": p["selling_price"],
            "cost_price": p["cost_price"],
            "shipping_cost": float(random.randint(40, 120)),
            "payment_method": random.choice(["COD", "prepaid"]),
            "status": random.choice(STATUSES),
            "created_at": created_at,
        })
    db.orders.insert_many(orders)

    print("Seed complete")
    print("Demo login: demo@dealsinbox.in / demo1234")


if __name__ == "__main__":
    main()
