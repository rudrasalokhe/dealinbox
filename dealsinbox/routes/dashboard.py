from datetime import datetime, timedelta
from bson import ObjectId
from flask import Blueprint, jsonify, render_template
from flask_login import login_required, current_user

from dealsinbox.db import mongo

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/dashboard")
@login_required
def dashboard_page():
    return render_template("dashboard.html")


@dashboard_bp.get("/api/dashboard/stats")
@login_required
def stats():
    try:
        user_id = ObjectId(current_user.id)
        start_of_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        pipeline = [
            {"$match": {"user_id": user_id, "created_at": {"$gte": start_of_day}}},
            {
                "$group": {
                    "_id": None,
                    "revenue": {"$sum": {"$multiply": ["$quantity", "$selling_price"]}},
                    "orders": {"$sum": 1},
                    "gross_profit": {
                        "$sum": {
                            "$subtract": [
                                {"$multiply": ["$quantity", "$selling_price"]},
                                {"$add": [{"$multiply": ["$quantity", {"$ifNull": ["$cost_price", 0]}]}, "$shipping_cost"]},
                            ]
                        }
                    },
                }
            },
        ]
        agg = list(mongo.db.orders.aggregate(pipeline))
        today = agg[0] if agg else {"revenue": 0, "orders": 0, "gross_profit": 0}
        avg_order = today["revenue"] / today["orders"] if today["orders"] else 0
        gross_margin = (today["gross_profit"] / today["revenue"] * 100) if today["revenue"] else 0

        low_stock_count = mongo.db.products.count_documents({
            "user_id": user_id,
            "$expr": {"$lte": ["$stock_count", "$low_stock_threshold"]},
        })

        return jsonify({
            "today_revenue": round(today["revenue"], 2),
            "today_orders": today["orders"],
            "avg_order_value": round(avg_order, 2),
            "gross_margin_pct": round(gross_margin, 2),
            "low_stock_alerts": low_stock_count,
        }), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@dashboard_bp.get("/api/dashboard/sparkline")
@login_required
def sparkline():
    try:
        user_id = ObjectId(current_user.id)
        from_date = datetime.utcnow() - timedelta(days=6)
        pipeline = [
            {"$match": {"user_id": user_id, "created_at": {"$gte": from_date}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "revenue": {"$sum": {"$multiply": ["$quantity", "$selling_price"]}},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        points = list(mongo.db.orders.aggregate(pipeline))
        return jsonify(points), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
