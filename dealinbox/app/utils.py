from datetime import datetime


def format_inr(value):
    value = int(round(value or 0))
    s = str(abs(value))
    if len(s) <= 3:
        out = s
    else:
        out = s[-3:]
        s = s[:-3]
        while s:
            out = s[-2:] + ',' + out
            s = s[:-2]
    sign = '-' if value < 0 else ''
    return f"₹{sign}{out}"


def format_date(d):
    if not d:
        return '-'
    return d.strftime('%d %b %Y')


def invoice_number(seq):
    return f"INV-{datetime.utcnow().year}-{seq:03d}"
