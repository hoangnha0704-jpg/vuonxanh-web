#!/bin/bash
# =====================================================================
#  SAO LƯU DỮ LIỆU WEBSITE (máy chủ tự chạy lúc 2h30 sáng mỗi ngày)
#  Gồm: đơn hàng & khách (khach.db), nội dung sửa trong quản trị,
#       ảnh tải lên, tài khoản quản trị, cấu hình Telegram.
#  Lưu ở /var/backups/vuonxanh, giữ 14 ngày gần nhất,
#  và gửi file qua Telegram nếu đã kết nối (file dưới 45MB).
#  Chạy tay:  vx-sao-luu
# =====================================================================
set -e
DATA="${VX_DATA:-/var/lib/vuonxanh}"
DICH="${VX_BACKUP_DIR:-/var/backups/vuonxanh}"
TG_API="${VX_TG_API:-https://api.telegram.org}"
HTP="${VX_HTPASSWD:-/etc/nginx/vuonxanh.htpasswd}"
GIU_NGAY=14
mkdir -p "$DICH"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
NGAY="$(TZ=Asia/Ho_Chi_Minh date +%F)"
FILE="$DICH/vuonxanh-$NGAY.tar.gz"

# Cơ sở dữ liệu: sao lưu an toàn kể cả khi đang có khách đặt hàng
if [ -f "$DATA/khach.db" ]; then
  python3 -c "import sqlite3,sys; s=sqlite3.connect(sys.argv[1]); d=sqlite3.connect(sys.argv[2]); s.backup(d); d.close(); s.close()" "$DATA/khach.db" "$TMP/khach.db"
fi
for f in noi-dung.json telegram.json; do [ -f "$DATA/$f" ] && cp "$DATA/$f" "$TMP/"; done
[ -d "$DATA/anh-tai-len" ] && cp -r "$DATA/anh-tai-len" "$TMP/"
[ -f "$HTP" ] && cp "$HTP" "$TMP/vuonxanh.htpasswd"

tar czf "$FILE.tmp" -C "$TMP" .
mv "$FILE.tmp" "$FILE"
chown root:www-data "$DICH" "$FILE" 2>/dev/null || true; chmod 750 "$DICH"; chmod 640 "$FILE"
find "$DICH" -name 'vuonxanh-*.tar.gz' -mtime +$GIU_NGAY -delete

CO="$(du -h "$FILE" | cut -f1)"
echo "Đã sao lưu: $FILE ($CO)"

# Gửi qua Telegram (nếu đã chạy vx-telegram)
CFG="$DATA/telegram.json"
if [ -f "$CFG" ]; then
  TOKEN="$(python3 -c "import json;print(json.load(open('$CFG')).get('token',''))")"
  IDS="$(python3 -c "import json;print(' '.join(str(x) for x in json.load(open('$CFG')).get('chat_ids',[])))")"
  BYTES="$(stat -c %s "$FILE")"
  for ID in $IDS; do
    if [ "$BYTES" -lt 47000000 ]; then
      curl -s -m 120 -F chat_id="$ID" -F document=@"$FILE" -F caption="💾 Sao lưu website ngày $NGAY ($CO). Giữ file này cẩn thận." \
        "$TG_API/bot$TOKEN/sendDocument" >/dev/null || echo "Không gửi được Telegram"
    else
      curl -s -m 30 -d chat_id="$ID" --data-urlencode text="💾 Đã sao lưu website ngày $NGAY ($CO) trên máy chủ. File quá lớn để gửi qua Telegram – tải ở trang quản trị, tab Đơn hàng & khách." \
        "$TG_API/bot$TOKEN/sendMessage" >/dev/null || true
    fi
  done
fi
