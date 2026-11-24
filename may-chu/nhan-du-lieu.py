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
import urllib.request
import urllib.parse
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB = os.environ.get("VX_DB", "/var/lib/vuonxanh/khach.db")
THU_MUC = os.path.dirname(DB)
ND_JSON = os.path.join(THU_MUC, "noi-dung.json")      # nội dung sửa từ trang quản trị
ND_JS = os.path.join(THU_MUC, "noi-dung.js")          # file web đọc (Nginx phục vụ ở /noi-dung.js)
ANH_DIR = os.path.join(THU_MUC, "anh-tai-len")        # ảnh tải lên (Nginx phục vụ ở /anh-tai-len/)
TELEGRAM = os.path.join(THU_MUC, "telegram.json")     # cấu hình báo đơn (tạo bằng lệnh vx-telegram)
TG_API = os.environ.get("VX_TG_API", "https://api.telegram.org")
SAO_LUU_DIR = os.environ.get("VX_BACKUP_DIR", "/var/backups/vuonxanh")
SITEMAP_GOC = os.environ.get("VX_SITEMAP_GOC", "/var/www/vuonxanh/sitemap.xml")
SITEMAP = os.path.join(THU_MUC, "sitemap.xml")
TRANG_QT = os.environ.get("VX_ADMIN_HTML", os.path.join(os.path.dirname(os.path.abspath(__file__)), "quan-tri.html"))
PORT = int(os.environ.get("VX_PORT", "8090"))
VN = timezone(timedelta(hours=7))
LOCK = threading.RLock()

BANG = {
    "don_hang": ("Đơn đặt hàng", ["thoi_gian", "ma_don", "ho_ten", "dien_thoai", "dia_chi", "san_pham", "tong_tien", "thanh_toan", "ghi_chu", "ip",
                                  "trang_thai", "tong", "ghi_chu_shop", "ngay_giao", "cap_nhat"]),
    "tu_van": ("Yêu cầu tư vấn", ["thoi_gian", "ho_ten", "dien_thoai", "email", "noi_dung", "ip", "trang_thai", "ghi_chu_shop", "cap_nhat"]),
    "dang_ky": ("Email đăng ký nhận tin", ["thoi_gian", "email", "ip"]),
}
TEN_COT = {"thoi_gian": "Thời gian", "ma_don": "Mã đơn", "ho_ten": "Họ tên", "dien_thoai": "Điện thoại", "dia_chi": "Địa chỉ",
           "san_pham": "Sản phẩm", "tong_tien": "Tổng tiền", "thanh_toan": "Thanh toán", "ghi_chu": "Ghi chú",
           "email": "Email", "noi_dung": "Nội dung", "ip": "IP", "trang_thai": "Trạng thái", "tong": "Tổng (số)",
           "ghi_chu_shop": "Ghi chú cửa hàng", "ngay_giao": "Ngày giao", "cap_nhat": "Cập nhật lúc"}
# Trạng thái đơn hàng / tư vấn (giá trị lưu -> chữ hiện)
TT_DON = {"moi": "Mới", "xac_nhan": "Đã xác nhận", "dang_giao": "Đang giao", "da_giao": "Đã giao", "huy": "Đã hủy"}
TT_TV = {"moi": "Mới", "da_lien_he": "Đã liên hệ", "xong": "Xong", "bo_qua": "Bỏ qua"}

PHONE = re.compile(r"^(0|\+84)[0-9 .]{8,12}$")
EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def ket_noi():
    os.makedirs(os.path.dirname(DB), exist_ok=True)
    con = sqlite3.connect(DB)
    for ten, (_, cot) in BANG.items():
        con.execute(f"CREATE TABLE IF NOT EXISTS {ten} (id INTEGER PRIMARY KEY, {', '.join(c + ' TEXT' for c in cot)})")
        # Nâng cấp dữ liệu cũ: thêm cột mới nếu chưa có
        co = {r[1] for r in con.execute(f"PRAGMA table_info({ten})")}
        for c in cot:
            if c not in co:
                con.execute(f"ALTER TABLE {ten} ADD COLUMN {c} TEXT DEFAULT ''")
    # Đơn cũ: lấy tổng tiền dạng số từ chữ "1.030.000₫", trạng thái mặc định là Mới
    for rid, tt in con.execute("SELECT id, tong_tien FROM don_hang WHERE tong IS NULL OR tong = ''").fetchall():
        con.execute("UPDATE don_hang SET tong = ? WHERE id = ?", (re.sub(r"[^0-9]", "", tt or "") or "0", rid))
    con.execute("UPDATE don_hang SET trang_thai = 'moi' WHERE trang_thai IS NULL OR trang_thai = ''")
    con.execute("UPDATE tu_van SET trang_thai = 'moi' WHERE trang_thai IS NULL OR trang_thai = ''")
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


def so_tien(n):
    try:
        return max(0, min(int(float(n)), 10_000_000_000))
    except (TypeError, ValueError):
        return 0


def tien(n):
    try:
        return f"{int(n):,}".replace(",", ".") + "₫"
    except (TypeError, ValueError):
        return ""


# =====================================================================
#  BÁO ĐƠN MỚI QUA TELEGRAM (cấu hình bằng lệnh: vx-telegram)
# =====================================================================
def ten_mien():
    try:
        with open("/etc/vuonxanh-domain", encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


def bao_telegram(noi_dung):
    """Gửi tin cho mọi người nhận đã kết nối. Chạy nền để khách không phải chờ."""
    try:
        with open(TELEGRAM, encoding="utf-8") as f:
            cfg = json.load(f)
    except (OSError, ValueError):
        return
    token, nguoi_nhan = cfg.get("token"), cfg.get("chat_ids") or []
    if not token or not nguoi_nhan:
        return

    def gui():
        for cid in nguoi_nhan:
            try:
                data = urllib.parse.urlencode({"chat_id": cid, "text": noi_dung[:4000], "disable_web_page_preview": "true"}).encode()
                urllib.request.urlopen(f"{TG_API}/bot{token}/sendMessage", data=data, timeout=10).read()
            except Exception as loi:  # mạng lỗi thì bỏ qua, đơn vẫn đã lưu
                print("Telegram lỗi:", loi, flush=True)
    threading.Thread(target=gui, daemon=True).start()


def link_qt():
    tm = ten_mien()
    return f"\nXem: https://{tm}/quan-tri/#khach" if tm else ""


def xu_ly(duong_dan, d, ip):
    """Kiểm tra và lưu. Trả về (mã HTTP, nội dung JSON)."""
    if chu(d.get("website"), 10):          # ô bẫy: người thật không thấy ô này, máy spam thì điền
        return 200, {"ok": True}
    now = datetime.now(VN).strftime("%Y-%m-%d %H:%M")
    if duong_dan == "/api/lien-he":
        ten, sdt, nd = chu(d.get("name"), 100), chu(d.get("phone"), 20), chu(d.get("msg"), 2000)
        if not ten or not PHONE.match(sdt) or not nd:
            return 400, {"ok": False, "loi": "Thiếu họ tên, số điện thoại hoặc nội dung."}
        luu("tu_van", {"thoi_gian": now, "ho_ten": ten, "dien_thoai": sdt, "email": chu(d.get("email"), 120), "noi_dung": nd, "ip": ip,
                       "trang_thai": "moi", "ghi_chu_shop": "", "cap_nhat": ""})
        bao_telegram(f"💬 YÊU CẦU TƯ VẤN MỚI\n👤 {ten}\n📞 {sdt}\n📝 {nd}{link_qt()}")
        return 200, {"ok": True}
    if duong_dan == "/api/dang-ky":
        em = chu(d.get("email"), 120)
        if not EMAIL.match(em):
            return 400, {"ok": False, "loi": "Email chưa đúng."}
        luu("dang_ky", {"thoi_gian": now, "email": em, "ip": ip})
        bao_telegram(f"✉️ Khách mới đăng ký nhận tin: {em}")
        return 200, {"ok": True}
    if duong_dan == "/api/dat-hang":
        ten, sdt, dc = chu(d.get("name"), 100), chu(d.get("phone"), 20), chu(d.get("addr"), 300)
        items = d.get("items") if isinstance(d.get("items"), list) else []
        if not ten or not PHONE.match(sdt) or not dc or not items:
            return 400, {"ok": False, "loi": "Thiếu họ tên, số điện thoại, địa chỉ hoặc sản phẩm."}
        sp = "; ".join(f"{chu(i.get('name'), 100)} × {chu(i.get('q'), 4)} ({tien(i.get('price'))})" for i in items[:50] if isinstance(i, dict))
        ma = "VX" + datetime.now(VN).strftime("%d%H%M%S")
        luu("don_hang", {"thoi_gian": now, "ma_don": ma, "ho_ten": ten, "dien_thoai": sdt, "dia_chi": dc, "san_pham": sp,
                         "tong_tien": tien(d.get("total")), "thanh_toan": chu(d.get("pay"), 60), "ghi_chu": chu(d.get("note"), 1000), "ip": ip,
                         "trang_thai": "moi", "tong": str(so_tien(d.get("total"))), "ghi_chu_shop": "", "ngay_giao": "", "cap_nhat": ""})
        ghi = chu(d.get("note"), 1000)
        bao_telegram(f"🛒 ĐƠN HÀNG MỚI {ma}\n👤 {ten}\n📞 {sdt}\n🏠 {dc}\n🌿 Sản phẩm:\n   • {sp.replace('; ', chr(10) + '   • ')}\n💰 Tổng: {tien(d.get('total'))} ({chu(d.get('pay'), 60) or 'COD'})"
                     + (f"\n📝 {ghi}" if ghi else "") + link_qt())
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
    d.setdefault("da", {})
    d.setdefault("cai_dat", {})
    return d


def nd_sitemap(d):
    """Sitemap = sitemap dựng sẵn + trang mới thêm trong quản trị – trang đã xóa."""
    try:
        with open(SITEMAP_GOC, encoding="utf-8") as f:
            goc = f.read()
    except OSError:
        return
    dong = re.findall(r"<url><loc>([^<]+)</loc><lastmod>([^<]+)</lastmod></url>", goc)
    if not dong:
        return
    m = re.match(r"(https?://[^/]+)", dong[0][0])
    nen = m.group(1) if m else ""
    hom_nay = datetime.now(VN).strftime("%Y-%m-%d")
    an = set()
    for loai, tien_to in (("sp", "san-pham"), ("bv", "bai-viet"), ("da", "du-an")):
        for k, r in d.get(loai, {}).items():
            if r.get("an"):
                an.add(f"{nen}/{tien_to}-{k}/")
    for k, r in d.get("dm", {}).items():
        if r.get("an"):
            an.add(f"{nen}/danh-muc-{k}/")
    ket_qua = [(u, lm) for u, lm in dong if u not in an]
    co = {u for u, _ in ket_qua}
    moi = []
    for loai, tien_to in (("sp", "san-pham"), ("bv", "bai-viet"), ("da", "du-an")):
        for k, r in d.get(loai, {}).items():
            moi.append((f"{nen}/{tien_to}-{k}/", r))
    for k, r in d.get("dm", {}).items():
        moi.append((f"{nen}/danh-muc-{k}/", r))
    for u, r in moi:
        if u not in co and u not in an:
            ket_qua.append((u, hom_nay))
            co.add(u)
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "\n".join(f"  <url><loc>{html.escape(u)}</loc><lastmod>{lm}</lastmod></url>" for u, lm in ket_qua) + "\n</urlset>\n"
    tam = SITEMAP + ".tmp"
    with open(tam, "w", encoding="utf-8") as f:
        f.write(xml)
    os.replace(tam, SITEMAP)


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
    nd_sitemap(d)


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
    ["name", "price", "cats", "size", "light", "short", "an", "them", "kw", "seoTitle", "seoDesc", "alt"].forEach(function (f) { if (r[f] !== undefined) p[f] = r[f]; });
    p.id = i; p.msp = 300 + i; p.stock = r.stock !== false;
    if (r.img) p.art = Object.assign({}, p.art, { img: r.img });
    p.art = Object.assign({}, p.art, { alt: r.alt || p.name });
  });
  for (var i = 0; i < PRODUCTS.length; i++) if (!PRODUCTS[i]) PRODUCTS[i] = { id: i, an: true, cats: [], art: macDinh, name: "", price: 0 };
  Object.keys(D.bv).forEach(function (k) {
    var i = +k, r = D.bv[k];
    var x = POSTS[i] || (POSTS[i] = { t: "", d: "", p: "", s: [], art: macDinh });
    ["t", "d", "p", "s", "an", "kw", "seoTitle", "seoDesc", "alt"].forEach(function (f) { if (r[f] !== undefined) x[f] = r[f]; });
    if (r.img) x.art = Object.assign({}, x.art, { img: r.img });
    x.art = Object.assign({}, x.art, { alt: r.alt || "" });
  });
  Object.keys(D.da || {}).forEach(function (k) {
    var i = +k, r = D.da[k];
    var x = PROJECTS[i] || (PROJECTS[i] = { t: "", p: "", plants: "", art: macDinh });
    ["t", "p", "plants", "loc", "s", "gal", "an", "them", "kw", "seoTitle", "seoDesc", "alt"].forEach(function (f) { if (r[f] !== undefined) x[f] = r[f]; });
    if (r.img) x.art = Object.assign({}, x.art, { img: r.img });
    x.art = Object.assign({}, x.art, { alt: r.alt || "" });
  });
  for (var q = 0; q < PROJECTS.length; q++) if (!PROJECTS[q]) PROJECTS[q] = { an: true, t: "", p: "", plants: "", art: macDinh };
  for (var j = 0; j < POSTS.length; j++) if (!POSTS[j]) POSTS[j] = { an: true, t: "", d: "", p: "", s: [], art: macDinh };
  var N = {};
  Object.keys(D.dm || {}).forEach(function (s) {
    var r = D.dm[s];
    CATEGORIES[s] = Object.assign({}, CATEGORIES[s] || {}, { name: r.name, intro: r.intro, an: !!r.an, kw: r.kw, seoTitle: r.seoTitle, seoDesc: r.seoDesc });
    N[s] = r.nhom;
  });
  window.DM_NHOM = N;
  if (D.hot) window.HOT_IDS = D.hot;
  window.CAI_DAT = D.cai_dat || {};
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


def seo(d):
    """Trường SEO chung: từ khóa chính, tiêu đề SEO, mô tả SEO, chữ mô tả ảnh."""
    return {"kw": e(d.get("kw"), 100), "seoTitle": e(d.get("seoTitle"), 120), "seoDesc": e(d.get("seoDesc"), 320), "alt": e(d.get("alt"), 160)}


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
                  "short": e(d.get("short"), 600), "stock": bool(d.get("stock", True)), "an": False, **seo(d)})
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
        r.update({"t": tieu_de, "d": ngay, "p": e(d.get("p"), 600), "s": muc, "an": False, **seo(d)})
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


def luu_du_an(d):
    nd = nd_doc()
    if d.get("id") == "moi":
        i = max([so_id(d.get("base_len"), 5000) or 0] + [int(k) + 1 for k in nd["da"]])
        r = {"them": int(time.time() * 1000)}
    else:
        i = so_id(d.get("id"), 5000)
        if i is None:
            return 400, {"ok": False, "loi": "Dự án không hợp lệ."}
        r = nd["da"].get(str(i), {})
    if d.get("xoa"):
        r["an"] = True
    else:
        tieu_de = e(d.get("t"), 200)
        if not tieu_de:
            return 400, {"ok": False, "loi": "Chưa nhập tên dự án."}
        muc = []
        for m in (d.get("s") or [])[:30]:
            if isinstance(m, list) and len(m) == 2 and (chu(m[0], 5) or chu(m[1], 5)):
                muc.append([e(m[0], 200) or "Chi tiết", doan_van(m[1], 8000)])
        gal = [u for u in (anh_hop_le(v) for v in (d.get("gal") or [])[:40]) if u]
        r.update({"t": tieu_de, "p": e(d.get("p"), 600), "loc": e(d.get("loc"), 120), "plants": e(d.get("plants"), 300),
                  "s": muc, "gal": gal, "an": False, **seo(d)})
        anh = anh_hop_le(d.get("img"))
        if anh:
            r["img"] = anh
    nd["da"][str(i)] = r
    nd_ghi(nd)
    return 200, {"ok": True, "id": i}


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
        r.update({"name": ten, "intro": e(d.get("intro"), 400), "nhom": "mua" if d.get("nhom") == "mua" else "loai", "an": False, **seo(d)})
    nd["dm"][slug] = r
    nd_ghi(nd)
    return 200, {"ok": True, "slug": slug}


def doc_dict(bang):
    cot = ["id"] + BANG[bang][1]
    with LOCK:
        con = ket_noi()
        rows = con.execute(f"SELECT {', '.join(cot)} FROM {bang} ORDER BY id DESC").fetchall()
        con.close()
    return [dict(zip(cot, r)) for r in rows]


def du_lieu_khach():
    try:
        ds = sorted(f for f in os.listdir(SAO_LUU_DIR) if re.fullmatch(r"vuonxanh-[0-9-]+\.tar\.gz", f))
    except OSError:
        ds = []
    don = doc_dict("don_hang")
    for x in don:
        x.pop("ip", None)
        x["tong"] = int(x.get("tong") or 0)
    tv = doc_dict("tu_van")
    for x in tv:
        x.pop("ip", None)
    dk = [{"id": x["id"], "thoi_gian": x["thoi_gian"], "email": x["email"]} for x in doc_dict("dang_ky")]
    return {"don_hang": don, "tu_van": tv, "dang_ky": dk, "tt_don": TT_DON, "tt_tv": TT_TV,
            "sao_luu": {"moi_nhat": ds[-1][9:-7] if ds else "", "so_ban": len(ds)}}


def sua_don(d):
    """Đổi trạng thái / ghi chú của đơn hàng hoặc yêu cầu tư vấn."""
    bang = "tu_van" if d.get("loai") == "tu_van" else "don_hang"
    i = so_id(d.get("id"), 10_000_000)
    if i is None:
        return 400, {"ok": False, "loi": "Mục không hợp lệ."}
    hop_le = TT_TV if bang == "tu_van" else TT_DON
    now = datetime.now(VN).strftime("%Y-%m-%d %H:%M")
    with LOCK:
        con = ket_noi()
        cu = con.execute(f"SELECT trang_thai FROM {bang} WHERE id = ?", (i,)).fetchone()
        if not cu:
            con.close()
            return 404, {"ok": False, "loi": "Không tìm thấy."}
        if "trang_thai" in d:
            tt = chu(d.get("trang_thai"), 20)
            if tt not in hop_le:
                con.close()
                return 400, {"ok": False, "loi": "Trạng thái không hợp lệ."}
            con.execute(f"UPDATE {bang} SET trang_thai = ?, cap_nhat = ? WHERE id = ?", (tt, now, i))
            if bang == "don_hang":
                # Ngày giao dùng để tính doanh thu theo tháng
                if tt == "da_giao" and cu[0] != "da_giao":
                    con.execute("UPDATE don_hang SET ngay_giao = ? WHERE id = ?", (now, i))
                elif tt != "da_giao":
                    con.execute("UPDATE don_hang SET ngay_giao = '' WHERE id = ?", (i,))
        if "ghi_chu_shop" in d:
            con.execute(f"UPDATE {bang} SET ghi_chu_shop = ?, cap_nhat = ? WHERE id = ?", (chu(d.get("ghi_chu_shop"), 2000), now, i))
        con.commit()
        con.close()
    return 200, {"ok": True}


def luu_cai_dat(d):
    nd = nd_doc()
    nd["cai_dat"] = {"tet": bool(d.get("tet")), "thong_bao": e(d.get("thong_bao"), 160)}
    nd_ghi(nd)
    return 200, {"ok": True}


QUAN_TRI_API = {"/quan-tri/api/cai-dat": luu_cai_dat, "/quan-tri/api/sua-don": sua_don, "/quan-tri/api/du-an": luu_du_an, "/quan-tri/api/danh-muc": luu_danh_muc, "/quan-tri/api/san-pham": luu_san_pham, "/quan-tri/api/bai-viet": luu_bai_viet, "/quan-tri/api/anh": luu_anh}


# =====================================================================
#  TRANG CÓ THẺ SEO ĐÚNG: sản phẩm / bài viết / dự án / danh mục
#  Nginx chuyển các đường dẫn này sang đây. Trang chưa sửa gì -> trả nguyên
#  file dựng sẵn. Trang đã sửa / thêm mới -> chèn lại tiêu đề, mô tả,
#  ảnh chia sẻ (og:image), canonical, dữ liệu có cấu trúc (JSON-LD).
#  Trang đã xóa -> 404 để Google bỏ khỏi kết quả tìm kiếm.
# =====================================================================
WEB_ROOT = os.environ.get("VX_WEB_ROOT", "/var/www/vuonxanh")
TRANG_RE = re.compile(r"^/(?:(san-pham|bai-viet|du-an)-([0-9]{1,5})|danh-muc-([a-z0-9-]{1,40}))/?$")


def doc_file(*phan):
    try:
        with open(os.path.join(WEB_ROOT, *phan), encoding="utf-8") as f:
            return f.read()
    except OSError:
        return None


def thay_meta(h, ten, gia_tri, kieu="name"):
    gia_tri = html.escape(html.unescape(gia_tri), quote=True)
    mau = re.compile(r'<meta %s="%s" content="[^"]*">' % (kieu, re.escape(ten)))
    the = f'<meta {kieu}="{ten}" content="{gia_tri}">'
    return mau.sub(lambda _: the, h, count=1) if mau.search(h) else h.replace("</title>", "</title>\n  " + the, 1)


def trang_seo(duong):
    """Trả (mã HTTP, html) hoặc None nếu không phải trang cần xử lý."""
    m = TRANG_RE.match(duong)
    if not m:
        return None
    loai, so, dm = m.groups()
    route = f"{loai}-{so}" if loai else f"danh-muc-{dm}"
    tinh = doc_file(route, "index.html")
    nd = nd_doc()
    r = (nd["dm"].get(dm) if dm else nd[{"san-pham": "sp", "bai-viet": "bv", "du-an": "da"}[loai]].get(str(int(so)))) or None
    if r and r.get("an") or (not r and tinh is None):
        return 404, doc_file("404.html") or "Không tìm thấy trang"
    if not r:
        return 200, tinh
    h = tinh if tinh is not None else doc_file("index.html") or ""
    tm = ten_mien()
    m_goc = re.search(r'<link rel="canonical" href="(https?://[^/"]+)', h)
    goc = f"https://{tm}" if tm else (m_goc.group(1) if m_goc else "")
    m_ten = re.search(r'<meta property="og:site_name" content="([^"]*)">', h)
    ten_shop = html.unescape(m_ten.group(1)) if m_ten else "Vườn Xanh"
    U = html.unescape
    if dm:
        ten, mo_ta, anh = U(r.get("name", "")), U(r.get("intro", "")), ""
    elif loai == "san-pham":
        ten, mo_ta, anh = U(r.get("name", "")), U(f"{r.get('name', '')} giá {tien(r.get('price'))}. {r.get('short', '')}"), r.get("img", "")
    else:
        ten, mo_ta, anh = U(r.get("t", "")), U(r.get("p", "")), r.get("img", "")
    tieu_de = U(r.get("seoTitle") or "") or (f"{ten}: mẫu đẹp, giá tốt – {ten_shop}" if dm else f"{ten} – {ten_shop}")
    mo_ta = (U(r.get("seoDesc") or "") or mo_ta)[:300]
    url = f"{goc}/{route}/"
    h = re.sub(r"<title>[\s\S]*?</title>", lambda _: f"<title>{html.escape(tieu_de)}</title>", h, count=1)
    h = thay_meta(h, "description", mo_ta)
    h = thay_meta(h, "og:title", tieu_de, "property")
    h = thay_meta(h, "og:description", mo_ta, "property")
    h = thay_meta(h, "og:url", url, "property")
    h = thay_meta(h, "og:type", "product" if loai == "san-pham" else "article" if loai else "website", "property")
    if anh:
        h = thay_meta(h, "og:image", goc + anh, "property")
    h = re.sub(r'<link rel="canonical" href="[^"]*">', lambda _: f'<link rel="canonical" href="{url}">', h, count=1)
    if "<link rel=\"canonical\"" not in h:
        h = h.replace("</title>", f'</title>\n  <link rel="canonical" href="{url}">', 1)
    ld = None
    if loai == "san-pham":
        ld = {"@context": "https://schema.org", "@type": "Product", "name": ten, "description": U(r.get("short", "")), "sku": str(300 + int(so)),
              "brand": {"@type": "Brand", "name": ten_shop},
              "offers": {"@type": "Offer", "priceCurrency": "VND", "price": r.get("price", 0), "url": url,
                         "availability": "https://schema.org/" + ("InStock" if r.get("stock", True) else "OutOfStock")}}
        if anh:
            ld["image"] = goc + anh
    elif loai in ("bai-viet", "du-an"):
        ld = {"@context": "https://schema.org", "@type": "Article", "headline": ten[:110], "description": mo_ta,
              "author": {"@type": "Organization", "name": ten_shop}, "mainEntityOfPage": url}
        if anh:
            ld["image"] = goc + anh
        if r.get("d"):
            dd, mm, yy = (r["d"].split("/") + ["", "", ""])[:3]
            if yy:
                ld["datePublished"] = f"{yy}-{mm.zfill(2)}-{dd.zfill(2)}"
    h = re.sub(r'<script type="application/ld\+json">[\s\S]*?</script>', "", h)
    if ld:
        h = h.replace("</head>", '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace("<", "\\u003c") + "</script>\n</head>", 1)
    return 200, h


def trang_quan_tri():
    try:
        ds = sorted(f for f in os.listdir(SAO_LUU_DIR) if re.fullmatch(r"vuonxanh-[0-9-]+\.tar\.gz", f))
    except OSError:
        ds = []
    sl = (f'Bản sao lưu gần nhất: <b>{ds[-1][9:-7]}</b> · {len(ds)} bản đang giữ trên máy chủ. <a class="btn" href="/quan-tri/sao-luu">Tải bản mới nhất</a>'
          if ds else "Chưa có bản sao lưu nào (máy chủ tự sao lưu lúc 2h30 sáng mỗi ngày).")
    phan = [f'<section><div class="hd"><h2>Sao lưu dữ liệu</h2></div><p style="margin:0;padding:0 18px 16px">{sl}</p></section>']
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
    cot_hien = [c for c in cot if c != "ip"]
    w.writerow([TEN_COT[c] for c in cot_hien])
    tt = TT_TV if bang == "tu_van" else TT_DON
    for r in doc(bang):
        x = dict(zip(cot, r))
        if "trang_thai" in x:
            x["trang_thai"] = tt.get(x["trang_thai"], x["trang_thai"])
        w.writerow([x.get(c, "") for c in cot_hien])
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
        kq = trang_seo(p)
        if kq:
            return self.gui(kq[0], kq[1], "text/html; charset=utf-8")
        if p in ("/quan-tri", "/quan-tri/"):
            with open(TRANG_QT, encoding="utf-8") as f:
                return self.gui(200, f.read(), "text/html; charset=utf-8")
        if p in ("/quan-tri/khach", "/quan-tri/khach/"):
            return self.gui(200, trang_quan_tri(), "text/html; charset=utf-8")
        if p == "/quan-tri/api/khach":
            return self.gui(200, du_lieu_khach())
        if p == "/quan-tri/sao-luu":
            try:
                ds = sorted(f for f in os.listdir(SAO_LUU_DIR) if re.fullmatch(r"vuonxanh-[0-9-]+\.tar\.gz", f))
            except OSError:
                ds = []
            if not ds:
                return self.gui(404, "Chưa có bản sao lưu nào.", "text/plain; charset=utf-8")
            with open(os.path.join(SAO_LUU_DIR, ds[-1]), "rb") as f:
                return self.gui(200, f.read(), "application/gzip", {"Content-Disposition": f'attachment; filename="{ds[-1]}"'})
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
    nd_sitemap(nd_doc())
    print(f"Vườn Xanh: đang nhận dữ liệu ở 127.0.0.1:{PORT}, lưu vào {DB}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), XuLy).serve_forever()
