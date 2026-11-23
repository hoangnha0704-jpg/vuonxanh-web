#!/usr/bin/env python3
# =====================================================================
#  NHẬN VÀ LƯU DỮ LIỆU KHÁCH CỦA WEBSITE VƯỜN XANH
#  - Đơn đặt hàng, yêu cầu tư vấn, email đăng ký nhận tin
#  - Lưu trong file SQLite: /var/lib/vuonxanh/khach.db
#  - Trang xem danh sách: https://tenmien/quan-tri/ (Nginx hỏi mật khẩu)
#  Chỉ dùng thư viện có sẵn của Python, không cần cài thêm gì.
#  Chạy nền bằng systemd (dịch vụ "vuonxanh-api"), chỉ nghe ở 127.0.0.1.
# =====================================================================
import csv
import html
import io
import json
import os
import re
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB = os.environ.get("VX_DB", "/var/lib/vuonxanh/khach.db")
PORT = int(os.environ.get("VX_PORT", "8090"))
VN = timezone(timedelta(hours=7))
LOCK = threading.Lock()

BANG = {
    "don_hang": ("Đơn đặt hàng", ["thoi_gian", "ma_don", "ho_ten", "dien_thoai", "dia_chi", "san_pham", "tong_tien", "thanh_toan", "ghi_chu", "ip"]),
    "tu_van": ("Yêu cầu tư vấn", ["thoi_gian", "ho_ten", "dien_thoai", "email", "noi_dung", "ip"]),
    "dang_ky": ("Email đăng ký nhận tin", ["thoi_gian", "email", "ip"]),
}
TEN_COT = {"thoi_gian": "Thời gian", "ma_don": "Mã đơn", "ho_ten": "Họ tên", "dien_thoai": "Điện thoại", "dia_chi": "Địa chỉ",
           "san_pham": "Sản phẩm", "tong_tien": "Tổng tiền", "thanh_toan": "Thanh toán", "ghi_chu": "Ghi chú",
           "email": "Email", "noi_dung": "Nội dung", "ip": "IP"}

PHONE = re.compile(r"^(0|\+84)[0-9 .]{8,12}$")
EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def ket_noi():
    os.makedirs(os.path.dirname(DB), exist_ok=True)
    con = sqlite3.connect(DB)
    for ten, (_, cot) in BANG.items():
        con.execute(f"CREATE TABLE IF NOT EXISTS {ten} (id INTEGER PRIMARY KEY, {', '.join(c + ' TEXT' for c in cot)})")
    con.commit()
    return con


def luu(bang, du_lieu):
    cot = BANG[bang][1]
    with LOCK:
        con = ket_noi()
        con.execute(f"INSERT INTO {bang} ({', '.join(cot)}) VALUES ({', '.join('?' * len(cot))})", [du_lieu.get(c, "") for c in cot])
        con.commit()
        con.close()


def doc(bang):
    with LOCK:
        con = ket_noi()
        rows = con.execute(f"SELECT {', '.join(BANG[bang][1])} FROM {bang} ORDER BY id DESC").fetchall()
        con.close()
    return rows


def chu(v, dai):
    """Lấy chuỗi đã cắt khoảng trắng, giới hạn độ dài."""
    return str(v or "").strip()[:dai]


def tien(n):
    try:
        return f"{int(n):,}".replace(",", ".") + "₫"
    except (TypeError, ValueError):
        return ""


def xu_ly(duong_dan, d, ip):
    """Kiểm tra và lưu. Trả về (mã HTTP, nội dung JSON)."""
    if chu(d.get("website"), 10):          # ô bẫy: người thật không thấy ô này, máy spam thì điền
        return 200, {"ok": True}
    now = datetime.now(VN).strftime("%Y-%m-%d %H:%M")
    if duong_dan == "/api/lien-he":
        ten, sdt, nd = chu(d.get("name"), 100), chu(d.get("phone"), 20), chu(d.get("msg"), 2000)
        if not ten or not PHONE.match(sdt) or not nd:
            return 400, {"ok": False, "loi": "Thiếu họ tên, số điện thoại hoặc nội dung."}
        luu("tu_van", {"thoi_gian": now, "ho_ten": ten, "dien_thoai": sdt, "email": chu(d.get("email"), 120), "noi_dung": nd, "ip": ip})
        return 200, {"ok": True}
    if duong_dan == "/api/dang-ky":
        em = chu(d.get("email"), 120)
        if not EMAIL.match(em):
            return 400, {"ok": False, "loi": "Email chưa đúng."}
        luu("dang_ky", {"thoi_gian": now, "email": em, "ip": ip})
        return 200, {"ok": True}
    if duong_dan == "/api/dat-hang":
        ten, sdt, dc = chu(d.get("name"), 100), chu(d.get("phone"), 20), chu(d.get("addr"), 300)
        items = d.get("items") if isinstance(d.get("items"), list) else []
        if not ten or not PHONE.match(sdt) or not dc or not items:
            return 400, {"ok": False, "loi": "Thiếu họ tên, số điện thoại, địa chỉ hoặc sản phẩm."}
        sp = "; ".join(f"{chu(i.get('name'), 100)} × {chu(i.get('q'), 4)} ({tien(i.get('price'))})" for i in items[:50] if isinstance(i, dict))
        ma = "VX" + datetime.now(VN).strftime("%d%H%M%S")
        luu("don_hang", {"thoi_gian": now, "ma_don": ma, "ho_ten": ten, "dien_thoai": sdt, "dia_chi": dc, "san_pham": sp,
                         "tong_tien": tien(d.get("total")), "thanh_toan": chu(d.get("pay"), 60), "ghi_chu": chu(d.get("note"), 1000), "ip": ip})
        return 200, {"ok": True, "ma_don": ma}
    return 404, {"ok": False}


def trang_quan_tri():
    phan = []
    for bang, (ten, cot) in BANG.items():
        rows = doc(bang)
        dau = "".join(f"<th>{TEN_COT[c]}</th>" for c in cot if c != "ip")
        than = "".join("<tr>" + "".join(f"<td>{html.escape(v or '')}</td>" for c, v in zip(cot, r) if c != "ip") + "</tr>" for r in rows)
        phan.append(f"""<section><div class="hd"><h2>{ten} <span>{len(rows)}</span></h2>
<a class="btn" href="/quan-tri/tai/{bang}.csv">Tải file Excel (CSV)</a></div>
<div class="wrap"><table><thead><tr>{dau}</tr></thead><tbody>{than or f'<tr><td colspan="{len(cot)}" class="empty">Chưa có dữ liệu</td></tr>'}</tbody></table></div></section>""")
    return f"""<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Quản trị – Vườn Xanh</title><style>
body{{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;background:#f7f5ef;color:#1f2a22}}
header{{background:#234f34;color:#fff;padding:16px 24px;display:flex;justify-content:space-between;align-items:center}}
header a{{color:#cfe5c4}} main{{padding:20px 24px;max-width:1400px;margin:auto}}
section{{background:#fff;border:1px solid #e4e0d4;border-radius:12px;margin-bottom:24px;overflow:hidden}}
.hd{{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;gap:12px;flex-wrap:wrap}}
h2{{margin:0;font-size:18px}} h2 span{{background:#e8f0e6;color:#2f6b45;border-radius:99px;padding:1px 10px;font-size:14px;margin-left:6px}}
.btn{{background:#2f6b45;color:#fff;text-decoration:none;padding:7px 14px;border-radius:99px;font-size:14px}}
.wrap{{overflow-x:auto}} table{{border-collapse:collapse;width:100%}} th,td{{text-align:left;padding:9px 14px;border-top:1px solid #eee;vertical-align:top}}
th{{background:#faf8f3;font-size:13px;color:#5b6b5f;white-space:nowrap}} td{{white-space:pre-wrap;max-width:420px}} .empty{{color:#8a948c;text-align:center}}
</style></head><body><header><b>Vườn Xanh · Dữ liệu khách</b><a href="/">Về trang web</a></header><main>{''.join(phan)}</main></body></html>"""


def file_csv(bang):
    cot = BANG[bang][1]
    buf = io.StringIO()
    buf.write("﻿")  # để Excel đọc đúng tiếng Việt
    w = csv.writer(buf)
    w.writerow([TEN_COT[c] for c in cot])
    w.writerows(doc(bang))
    return buf.getvalue().encode("utf-8")


class XuLy(BaseHTTPRequestHandler):
    server_version = "VuonXanh"

    def gui(self, ma, body, loai="application/json; charset=utf-8", them=None):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        elif isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(ma)
        self.send_header("Content-Type", loai)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (them or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def ip(self):
        return self.headers.get("X-Real-IP") or self.client_address[0]

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = 0
        if n <= 0 or n > 32768:
            return self.gui(400, {"ok": False})
        try:
            d = json.loads(self.rfile.read(n).decode("utf-8"))
            if not isinstance(d, dict):
                raise ValueError
        except (ValueError, UnicodeDecodeError):
            return self.gui(400, {"ok": False})
        ma, kq = xu_ly(self.path.split("?")[0], d, self.ip())
        self.gui(ma, kq)

    def do_GET(self):
        p = self.path.split("?")[0]
        if p in ("/quan-tri", "/quan-tri/"):
            return self.gui(200, trang_quan_tri(), "text/html; charset=utf-8")
        m = re.fullmatch(r"/quan-tri/tai/([a-z_]+)\.csv", p)
        if m and m.group(1) in BANG:
            ten = f"{m.group(1)}-{datetime.now(VN):%Y%m%d}.csv"
            return self.gui(200, file_csv(m.group(1)), "text/csv; charset=utf-8", {"Content-Disposition": f'attachment; filename="{ten}"'})
        self.gui(404, {"ok": False})

    def log_message(self, fmt, *args):
        pass  # không ghi log từng lượt truy cập


if __name__ == "__main__":
    ket_noi().close()
    print(f"Vườn Xanh: đang nhận dữ liệu ở 127.0.0.1:{PORT}, lưu vào {DB}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), XuLy).serve_forever()
