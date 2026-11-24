#!/usr/bin/env python3
# =====================================================================
#  KẾT NỐI TELEGRAM ĐỂ NHẬN BÁO ĐƠN HÀNG VÀ BẢN SAO LƯU
#  Cách dùng (chạy trên VPS):
#    vx-telegram MÃ_BOT        -> kết nối bot, thêm người nhận đầu tiên
#    vx-telegram --them        -> thêm người nhận (ví dụ chủ cửa hàng)
#    vx-telegram --ds          -> xem danh sách người nhận
#    vx-telegram --thu         -> gửi tin thử
#    vx-telegram --tat         -> tắt báo Telegram
# =====================================================================
import json
import os
import sys
import time
import urllib.parse
import urllib.request

CFG = os.environ.get("VX_TG_CFG", "/var/lib/vuonxanh/telegram.json")
TG_API = os.environ.get("VX_TG_API", "https://api.telegram.org")


def api(token, method, **tham_so):
    data = urllib.parse.urlencode(tham_so).encode() if tham_so else None
    with urllib.request.urlopen(f"{TG_API}/bot{token}/{method}", data=data, timeout=40) as r:
        return json.load(r)


def doc():
    try:
        with open(CFG, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def ghi(cfg):
    os.makedirs(os.path.dirname(CFG), exist_ok=True)
    with open(CFG, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=1)
    os.chmod(CFG, 0o600)
    try:
        import pwd
        u = pwd.getpwnam("www-data")
        os.chown(CFG, u.pw_uid, u.pw_gid)
    except (KeyError, ImportError):
        pass


def cho_nguoi_nhan(token, ten_bot):
    """Chờ người dùng bấm Start / nhắn tin cho bot, trả về chat id."""
    try:
        cu = api(token, "getUpdates", timeout=0).get("result", [])
        offset = cu[-1]["update_id"] + 1 if cu else 0
    except Exception:
        offset = 0
    print(f"\n👉 Mở Telegram trên điện thoại, tìm  @{ten_bot}  (hoặc mở https://t.me/{ten_bot})")
    print("   rồi bấm  Bắt đầu / Start  (hoặc nhắn một chữ bất kỳ cho bot).")
    print("   Muốn báo vào nhóm: thêm bot vào nhóm rồi nhắn một tin trong nhóm.")
    print("   Đang chờ trong 3 phút…", flush=True)
    het_gio = time.time() + 180
    while time.time() < het_gio:
        try:
            kq = api(token, "getUpdates", offset=offset, timeout=25).get("result", [])
        except Exception:
            time.sleep(3)
            continue
        for u in kq:
            offset = u["update_id"] + 1
            msg = u.get("message") or u.get("my_chat_member") or {}
            chat = msg.get("chat")
            if chat:
                ten = chat.get("title") or " ".join(x for x in (chat.get("first_name"), chat.get("last_name")) if x) or str(chat["id"])
                return chat["id"], ten
    return None, None


def main():
    a = sys.argv[1:]
    cfg = doc()
    if not a:
        print(__doc__ if __doc__ else "Xem hướng dẫn ở đầu file.")
        print("Cách dùng: vx-telegram MÃ_BOT | --them | --ds | --thu | --tat")
        return 1
    if a[0] == "--tat":
        if os.path.exists(CFG):
            os.remove(CFG)
        print("Đã tắt báo Telegram.")
        return 0
    if a[0] in ("--ds", "--thu", "--them") and not cfg.get("token"):
        print("Chưa kết nối bot. Chạy trước:  vx-telegram MÃ_BOT")
        return 1
    if a[0] == "--ds":
        for cid, ten in cfg.get("ten", {}).items():
            print(f"  {ten}  (id {cid})")
        return 0
    if a[0] == "--thu":
        for cid in cfg.get("chat_ids", []):
            api(cfg["token"], "sendMessage", chat_id=cid, text="✅ Tin thử từ website: báo đơn hàng đang hoạt động.")
        print("Đã gửi tin thử.")
        return 0
    if a[0] == "--them":
        token = cfg["token"]
    else:
        token = a[0].strip()
        try:
            me = api(token, "getMe")
            assert me.get("ok")
        except Exception:
            print("❌ Mã bot không đúng. Kiểm tra lại mã BotFather gửi (dạng 123456789:ABC…).")
            return 1
        cfg = {"token": token, "bot": me["result"]["username"], "chat_ids": cfg.get("chat_ids", []) if cfg.get("token") == token else [], "ten": cfg.get("ten", {}) if cfg.get("token") == token else {}}
    cid, ten = cho_nguoi_nhan(token, cfg.get("bot") or api(token, "getMe")["result"]["username"])
    if not cid:
        print("❌ Hết thời gian chờ mà chưa thấy ai nhắn cho bot. Chạy lại lệnh và bấm Start trong Telegram.")
        return 1
    if cid not in cfg["chat_ids"]:
        cfg["chat_ids"].append(cid)
    cfg.setdefault("ten", {})[str(cid)] = ten
    ghi(cfg)
    api(token, "sendMessage", chat_id=cid, text="✅ Đã kết nối! Từ giờ bạn sẽ nhận báo đơn hàng, yêu cầu tư vấn và bản sao lưu hằng ngày của website tại đây.")
    print(f"✅ Đã thêm người nhận: {ten}. Kiểm tra tin nhắn trong Telegram.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
