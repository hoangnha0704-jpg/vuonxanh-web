#!/usr/bin/env python3
# =====================================================================
#  NHẬN VÀ LƯU DỮ LIỆU KHÁCH CỦA WEBSITE VƯỜN XANH
#  - Đơn đặt hàng, yêu cầu tư vấn, email đăng ký nhận tin
#  - Lưu trong file SQLite: /var/lib/vuonxanh/khach.db
#  - Trang xem danh sách: https://tenmien/quan-tri/ (Nginx hỏi mật khẩu)
#  Chỉ dùng thư viện có sẵn của Python, không cần cài thêm gì.
#  Chạy nền bằng systemd (dịch vụ "vuonxanh-api"), chỉ nghe ở 127.0.0.1.
# =====================================================================
import base64
import csv
import html
import secrets
import time
import io
import json
import os
import re
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB = os.environ.get("VX_DB", "/var/lib/vuonxanh/khach.db")
THU_MUC = os.path.dirname(DB)
ND_JSON = os.path.join(THU_MUC, "noi-dung.json")      # nội dung sửa từ trang quản trị
ND_JS = os.path.join(THU_MUC, "noi-dung.js")          # file web đọc (Nginx phục vụ ở /noi-dung.js)
ANH_DIR = os.path.join(THU_MUC, "anh-tai-len")        # ảnh tải lên (Nginx phục vụ ở /anh-tai-len/)
TRANG_QT = os.environ.get("VX_ADMIN_HTML", os.path.join(os.path.dirname(os.path.abspath(__file__)), "quan-tri.html"))
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


# =====================================================================
#  QUẢN LÝ NỘI DUNG (sản phẩm, bài viết, ảnh)
# =====================================================================
SLUG = re.compile(r"^[a-z0-9-]{1,40}$")
ANH_URL = re.compile(r"^/(anh|anh-tai-len)/[A-Za-z0-9._-]{1,80}\.(webp|jpg|jpeg|png)$")


def nd_doc():
    try:
        with open(ND_JSON, encoding="utf-8") as f:
            d = json.load(f)
    except (FileNotFoundError, ValueError):
        d = {}
    d.setdefault("sp", {})
    d.setdefault("bv", {})
    d.setdefault("dm", {})
    return d


def nd_ghi(d):
    """Ghi JSON (kèm bản sao lưu) rồi tạo lại noi-dung.js cho web."""
    os.makedirs(THU_MUC, exist_ok=True)
    if os.path.exists(ND_JSON):
        os.replace(ND_JSON, ND_JSON + ".bak")
    tam = ND_JSON + ".tmp"
    with open(tam, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    os.replace(tam, ND_JSON)
    nd_xuat_js(d)


def nd_xuat_js(d=None):
    d = d if d is not None else nd_doc()
    du_lieu = json.dumps(d, ensure_ascii=False).replace("</", "<\\/")
    js = """// Tự tạo bởi trang quản trị – không sửa tay
(function () {
  if (typeof PRODUCTS === "undefined") return;
  var D = %s;
  var macDinh = { kind: "leafy", bg: "#eef2ea", pot: "#ffffff", leaf: "#2e7a2a", leaf2: "#47963c" };
  Object.keys(D.sp).forEach(function (k) {
    var i = +k, r = D.sp[k];
    var p = PRODUCTS[i] || (PRODUCTS[i] = { art: macDinh, cats: [], short: "", size: "", light: "", price: 0, name: "" });
    ["name", "price", "cats", "size", "light", "short", "an", "them"].forEach(function (f) { if (r[f] !== undefined) p[f] = r[f]; });
    p.id = i; p.msp = 300 + i; p.stock = r.stock !== false;
    if (r.img) p.art = Object.assign({}, p.art, { img: r.img, alt: p.name });
  });
  for (var i = 0; i < PRODUCTS.length; i++) if (!PRODUCTS[i]) PRODUCTS[i] = { id: i, an: true, cats: [], art: macDinh, name: "", price: 0 };
  Object.keys(D.bv).forEach(function (k) {
    var i = +k, r = D.bv[k];
    var x = POSTS[i] || (POSTS[i] = { t: "", d: "", p: "", s: [], art: macDinh });
    ["t", "d", "p", "s", "an"].forEach(function (f) { if (r[f] !== undefined) x[f] = r[f]; });
    if (r.img) x.art = Object.assign({}, x.art, { img: r.img, alt: "" });
  });
  for (var j = 0; j < POSTS.length; j++) if (!POSTS[j]) POSTS[j] = { an: true, t: "", d: "", p: "", s: [], art: macDinh };
  var N = {};
  Object.keys(D.dm || {}).forEach(function (s) {
    var r = D.dm[s];
    CATEGORIES[s] = Object.assign({}, CATEGORIES[s] || {}, { name: r.name, intro: r.intro, an: !!r.an });
    N[s] = r.nhom;
  });
  window.DM_NHOM = N;
  if (D.hot) window.HOT_IDS = D.hot;
})();
""" % du_lieu
    tam = ND_JS + ".tmp"
    with open(tam, "w", encoding="utf-8") as f:
        f.write(js)
    os.replace(tam, ND_JS)


def e(v, dai):
    """Chữ người dùng nhập: cắt độ dài và mã hóa HTML để không chèn được mã lạ vào web."""
    return html.escape(chu(v, dai), quote=True)


def doan_van(v, dai):
    """Nội dung nhiều đoạn: mã hóa HTML, dòng trống = đoạn mới, xuống dòng = <br>."""
    t = html.escape(str(v or "").strip()[:dai].replace("\r", ""), quote=True)
    return re.sub(r"\n{2,}", "</p><p>", t).replace("\n", "<br>")


def so_id(v, toi_da=100000):
    try:
        i = int(v)
    except (TypeError, ValueError):
        return None
    return i if 0 <= i < toi_da else None


def anh_hop_le(v):
    v = chu(v, 120)
    return v if ANH_URL.match(v) else ""


def luu_san_pham(d):
    nd = nd_doc()
    if d.get("id") == "moi":
        i = max([so_id(d.get("base_len"), 5000) or 0] + [int(k) + 1 for k in nd["sp"]])
        r = {"them": int(time.time() * 1000)}
    else:
        i = so_id(d.get("id"), 5000)
        if i is None:
            return 400, {"ok": False, "loi": "Sản phẩm không hợp lệ."}
        r = nd["sp"].get(str(i), {})
    if d.get("xoa"):
        r["an"] = True
    else:
        ten = e(d.get("name"), 120)
        if not ten:
            return 400, {"ok": False, "loi": "Chưa nhập tên sản phẩm."}
        try:
            gia = int(d.get("price"))
            assert 0 <= gia <= 1_000_000_000
        except (TypeError, ValueError, AssertionError):
            return 400, {"ok": False, "loi": "Giá chưa đúng."}
        cats = [c for c in (d.get("cats") or []) if isinstance(c, str) and SLUG.match(c)][:12]
        if not cats:
            return 400, {"ok": False, "loi": "Chọn ít nhất một danh mục."}
        r.update({"name": ten, "price": gia, "cats": cats, "size": e(d.get("size"), 80), "light": e(d.get("light"), 80),
                  "short": e(d.get("short"), 600), "stock": bool(d.get("stock", True)), "an": False})
        anh = anh_hop_le(d.get("img"))
        if anh:
            r["img"] = anh
    nd["sp"][str(i)] = r
    if isinstance(d.get("hot_ids"), list):
        ds = [so_id(v, 5000) for v in d["hot_ids"]]
        nd["hot"] = list(dict.fromkeys(x for x in ds if x is not None))[:40]   # giữ thứ tự, bỏ trùng
        if d.get("hot") and i not in nd["hot"]:
            nd["hot"].append(i)
    nd_ghi(nd)
    return 200, {"ok": True, "id": i}


def luu_bai_viet(d):
    nd = nd_doc()
    if d.get("id") == "moi":
        i = max([so_id(d.get("base_len"), 5000) or 0] + [int(k) + 1 for k in nd["bv"]])
        r = {}
    else:
        i = so_id(d.get("id"), 5000)
        if i is None:
            return 400, {"ok": False, "loi": "Bài viết không hợp lệ."}
        r = nd["bv"].get(str(i), {})
    if d.get("xoa"):
        r["an"] = True
    else:
        tieu_de = e(d.get("t"), 200)
        if not tieu_de:
            return 400, {"ok": False, "loi": "Chưa nhập tiêu đề."}
        ngay = chu(d.get("d"), 10)
        if not re.fullmatch(r"\d{1,2}/\d{1,2}/\d{4}", ngay):
            ngay = datetime.now(VN).strftime("%d/%m/%Y")
        muc = []
        for m in (d.get("s") or [])[:30]:
            if isinstance(m, list) and len(m) == 2 and (chu(m[0], 5) or chu(m[1], 5)):
                muc.append([e(m[0], 200) or "Chi tiết", doan_van(m[1], 8000)])
        r.update({"t": tieu_de, "d": ngay, "p": e(d.get("p"), 600), "s": muc, "an": False})
        anh = anh_hop_le(d.get("img"))
        if anh:
            r["img"] = anh
    nd["bv"][str(i)] = r
    nd_ghi(nd)
    return 200, {"ok": True, "id": i}


def luu_anh(d):
    m = re.fullmatch(r"data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)", str(d.get("data") or ""))
    if not m:
        return 400, {"ok": False, "loi": "File không phải ảnh."}
    try:
        b = base64.b64decode(m.group(2), validate=True)
    except ValueError:
        return 400, {"ok": False, "loi": "Ảnh bị lỗi."}
    dau = {"jpeg": b"\xff\xd8\xff", "png": b"\x89PNG", "webp": b"RIFF"}[m.group(1)]
    if not b.startswith(dau) or len(b) > 6 * 1024 * 1024:
        return 400, {"ok": False, "loi": "Ảnh không hợp lệ hoặc quá lớn (tối đa 6MB)."}
    os.makedirs(ANH_DIR, exist_ok=True)
    duoi = "jpg" if m.group(1) == "jpeg" else m.group(1)
    ten = f"{datetime.now(VN):%Y%m%d-%H%M%S}-{secrets.token_hex(3)}.{duoi}"
    with open(os.path.join(ANH_DIR, ten), "wb") as f:
        f.write(b)
    return 200, {"ok": True, "url": f"/anh-tai-len/{ten}"}


def luu_danh_muc(d):
    nd = nd_doc()
    slug = chu(d.get("slug"), 40)
    if not SLUG.match(slug) or slug == "dich-vu":
        return 400, {"ok": False, "loi": "Tên danh mục không hợp lệ."}
    if d.get("moi") and slug in nd["dm"] and not nd["dm"][slug].get("an"):
        return 400, {"ok": False, "loi": "Đã có danh mục trùng tên."}
    r = nd["dm"].get(slug, {}) if not d.get("moi") else {}
    if d.get("xoa"):
        r.update({"an": True, "name": r.get("name") or e(d.get("name"), 80), "intro": r.get("intro") or e(d.get("intro"), 400),
                  "nhom": r.get("nhom") or ("mua" if d.get("nhom") == "mua" else "loai")})
    else:
        ten = e(d.get("name"), 80)
        if not ten:
            return 400, {"ok": False, "loi": "Chưa nhập tên danh mục."}
        r.update({"name": ten, "intro": e(d.get("intro"), 400), "nhom": "mua" if d.get("nhom") == "mua" else "loai", "an": False})
    nd["dm"][slug] = r
    nd_ghi(nd)
    return 200, {"ok": True, "slug": slug}


QUAN_TRI_API = {"/quan-tri/api/danh-muc": luu_danh_muc, "/quan-tri/api/san-pham": luu_san_pham, "/quan-tri/api/bai-viet": luu_bai_viet, "/quan-tri/api/anh": luu_anh}


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
</style></head><body><header><b>Vườn Xanh · Dữ liệu khách</b><a href="/quan-tri/" target="_top">Về trang quản trị</a></header><script>if (top !== self) document.querySelector("header").remove();</script><main>{''.join(phan)}</main></body></html>"""


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
        duong = self.path.split("?")[0]
        quan_tri = duong in QUAN_TRI_API
        # chỉ nhận JSON: chặn trang web lạ gửi lén bằng tài khoản quản trị đang đăng nhập
        if not (self.headers.get("Content-Type") or "").startswith("application/json"):
            return self.gui(415, {"ok": False})
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = 0
        if n <= 0 or n > (9 * 1024 * 1024 if quan_tri else 32768):
            return self.gui(400, {"ok": False})
        try:
            d = json.loads(self.rfile.read(n).decode("utf-8"))
            if not isinstance(d, dict):
                raise ValueError
        except (ValueError, UnicodeDecodeError):
            return self.gui(400, {"ok": False})
        if quan_tri:
            with LOCK:
                ma, kq = QUAN_TRI_API[duong](d)
            return self.gui(ma, kq)
        ma, kq = xu_ly(duong, d, self.ip())
        self.gui(ma, kq)

    def do_GET(self):
        p = self.path.split("?")[0]
        if p in ("/quan-tri", "/quan-tri/"):
            with open(TRANG_QT, encoding="utf-8") as f:
                return self.gui(200, f.read(), "text/html; charset=utf-8")
        if p in ("/quan-tri/khach", "/quan-tri/khach/"):
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
    nd_xuat_js()   # luôn có sẵn noi-dung.js cho web
    print(f"Vườn Xanh: đang nhận dữ liệu ở 127.0.0.1:{PORT}, lưu vào {DB}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), XuLy).serve_forever()
