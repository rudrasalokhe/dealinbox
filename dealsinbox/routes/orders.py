import csv
import io
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request, Response, render_template
from flask_login import login_required, current_user

from db import mongo

orders_bp = Blueprint("orders", __name__)


@orders_bp.get("/orders")
@login_required
def orders_page():
    return render_template("orders.html")


@orders_bp.get("/api/orders")
@login_required
def list_orders():
    try:
        status = request.args.get("status", "").strip()
        search = request.args.get("search", "").strip()
        page = max(int(request.args.get("page", 1)), 1)
        per_page = 20

        query = {"user_id": ObjectId(current_user.id)}
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"customer_name": {"$regex": search, "$options": "i"}},
                {"order_number": {"$regex": search, "$options": "i"}},
            ]

        cursor = mongo.db.orders.find(query).sort("created_at", -1).skip((page - 1) * per_page).limit(per_page)
        items = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["product_id"] = str(doc["product_id"])
            doc["user_id"] = str(doc["user_id"])
            items.append(doc)

        total = mongo.db.orders.count_documents(query)
        return jsonify({"items": items, "page": page, "pages": (total + per_page - 1) // per_page, "total": total}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@orders_bp.post("/api/orders")
@login_required
def create_order():
    try:
        data = request.get_json(force=True)
        doc = {
            "user_id": ObjectId(current_user.id),
            "order_number": data["order_number"],
            "customer_name": data["customer_name"],
            "customer_phone": data.get("customer_phone", ""),
            "customer_city": data.get("customer_city", ""),
            "product_id": ObjectId(data["product_id"]),
            "product_name": data["product_name"],
            "quantity": int(data["quantity"]),
            "selling_price": float(data["selling_price"]),
            "cost_price": float(data.get("cost_price", 0)),
            "shipping_cost": float(data.get("shipping_cost", 0)),
            "payment_method": data.get("payment_method", "COD"),
            "status": data.get("status", "pending"),
            "created_at": datetime.utcnow(),
        }
        result = mongo.db.orders.insert_one(doc)
        return jsonify({"id": str(result.inserted_id)}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@orders_bp.patch("/api/orders/<order_id>")
@login_required
def update_order(order_id):
    try:
        updates = request.get_json(force=True)
        updates.pop("_id", None)
        result = mongo.db.orders.update_one(
            {"_id": ObjectId(order_id), "user_id": ObjectId(current_user.id)},
            {"$set": updates},
        )
        if result.matched_count == 0:
            return jsonify({"error": "Order not found"}), 404
        return jsonify({"message": "updated"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@orders_bp.delete("/api/orders/<order_id>")
@login_required
def delete_order(order_id):
    try:
        result = mongo.db.orders.delete_one({"_id": ObjectId(order_id), "user_id": ObjectId(current_user.id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Order not found"}), 404
        return jsonify({"message": "deleted"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@orders_bp.get("/api/orders/export/csv")
@login_required
def export_csv():
    try:
        query = {"user_id": ObjectId(current_user.id)}
        cursor = mongo.db.orders.find(query).sort("created_at", -1)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["order_number", "customer_name", "city", "product_name", "quantity", "selling_price", "status", "created_at"])

        for o in cursor:
            writer.writerow([
                o.get("order_number"), o.get("customer_name"), o.get("customer_city"), o.get("product_name"),
                o.get("quantity"), o.get("selling_price"), o.get("status"), o.get("created_at"),
            ])

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=orders.csv"},
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
