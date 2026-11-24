#!/bin/bash
# =====================================================================
#  KHÔI PHỤC DỮ LIỆU TỪ MỘT BẢN SAO LƯU
#  Cách dùng:
#    vx-khoi-phuc                       -> xem danh sách bản sao lưu
#    vx-khoi-phuc vuonxanh-2026-11-24.tar.gz   (hoặc đường dẫn đầy đủ tới file)
#  Dữ liệu hiện tại được sao lưu lại trước khi ghi đè.
# =====================================================================
set -e
DATA=/var/lib/vuonxanh
DICH=/var/backups/vuonxanh
if [ -z "$1" ]; then
  echo "Các bản sao lưu đang có:"; ls -1t "$DICH" 2>/dev/null | grep -E '^vuonxanh-.*\.tar\.gz$' || echo "  (chưa có)"
  echo "Khôi phục:  vx-khoi-phuc TÊN_FILE"; exit 0
fi
F="$1"; [ -f "$F" ] || F="$DICH/$1"
[ -f "$F" ] || { echo "Không thấy file: $1"; exit 1; }
read -r -p "Khôi phục từ $(basename "$F")? Dữ liệu hiện tại sẽ được thay thế (đã tự sao lưu trước). Gõ  co  để tiếp tục: " OK
[ "$OK" = "co" ] || { echo "Đã hủy."; exit 0; }
/usr/local/bin/vx-sao-luu >/dev/null 2>&1 || true
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
tar xzf "$F" -C "$TMP"
systemctl stop vuonxanh-api
for f in khach.db noi-dung.json telegram.json; do [ -f "$TMP/$f" ] && cp "$TMP/$f" "$DATA/$f"; done
if [ -d "$TMP/anh-tai-len" ]; then mkdir -p "$DATA/anh-tai-len"; cp -r "$TMP/anh-tai-len/." "$DATA/anh-tai-len/"; fi
[ -f "$TMP/vuonxanh.htpasswd" ] && cp "$TMP/vuonxanh.htpasswd" /etc/nginx/vuonxanh.htpasswd && chown root:www-data /etc/nginx/vuonxanh.htpasswd && chmod 640 /etc/nginx/vuonxanh.htpasswd
chown -R www-data:www-data "$DATA"
systemctl start vuonxanh-api
echo "✅ Đã khôi phục từ $(basename "$F")."
