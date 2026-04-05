from bson import ObjectId
from flask import Blueprint, jsonify, render_template
from flask_login import login_required, current_user

from db import mongo

customers_bp = Blueprint("customers", __name__)


@customers_bp.get("/customers")
@login_required
def customers_page():
    return render_template("customers.html")


@customers_bp.get("/api/customers")
@login_required
def list_customers():
    try:
        pipeline = [
            {"$match": {"user_id": ObjectId(current_user.id)}},
            {
                "$group": {
                    "_id": "$customer_phone",
                    "customer_name": {"$first": "$customer_name"},
                    "customer_city": {"$first": "$customer_city"},
                    "total_orders": {"$sum": 1},
                    "total_spend": {"$sum": {"$multiply": ["$quantity", "$selling_price"]}},
                    "last_order_date": {"$max": "$created_at"},
                }
            },
            {"$sort": {"last_order_date": -1}},
        ]
        rows = list(mongo.db.orders.aggregate(pipeline))
        for r in rows:
            r["id"] = str(r.pop("_id"))
        return jsonify(rows), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@customers_bp.get("/api/customers/<phone>")
@login_required
def customer_detail(phone):
    try:
        pipeline = [
            {"$match": {"user_id": ObjectId(current_user.id), "customer_phone": phone}},
            {"$sort": {"created_at": -1}},
        ]
        rows = list(mongo.db.orders.aggregate(pipeline))
        for r in rows:
            r["_id"] = str(r["_id"])
            r["user_id"] = str(r["user_id"])
            r["product_id"] = str(r["product_id"])
        return jsonify(rows), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
