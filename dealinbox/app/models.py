from dataclasses import dataclass
from flask_login import UserMixin, current_user
from functools import wraps
from flask import abort
from bson import ObjectId


@dataclass
class User(UserMixin):
    id: str
    email: str
    org_id: str
    role: str
    verified: bool

    @staticmethod
    def from_doc(doc):
        return User(id=str(doc['_id']), email=doc['email'], org_id=str(doc['org_id']), role=doc.get('role', 'viewer'), verified=doc.get('verified', False))


def oid(v):
    return ObjectId(v) if isinstance(v, str) else v


def org_filter(extra=None):
    payload = {'org_id': oid(current_user.org_id)}
    if extra:
        payload.update(extra)
    return payload


def role_required(*roles):
    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if current_user.role not in roles:
                abort(403)
            return fn(*args, **kwargs)
        return wrapper
    return deco
