#!/bin/bash
# =====================================================================
#  CÀI WEBSITE VƯỜN XANH LÊN VPS (Ubuntu)
#  Cách dùng:   bash cai-dat.sh                  (chưa có tên miền – xem web bằng IP)
#               bash cai-dat.sh tenmien.com      (có tên miền – tự bật HTTPS)
#  Chạy lại lệnh này mỗi khi muốn cập nhật web (file mới sẽ ghi đè file cũ).
# =====================================================================
set -e

DOMAIN="$1"
EMAIL="$2"
# Bỏ http://, https://, www. và dấu / thừa nếu người dùng gõ kèm
DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#www.}"; DOMAIN="${DOMAIN%%/*}"
# Không có tên miền (hoặc gõ IP) thì chạy bằng địa chỉ IP, chưa bật HTTPS
IPMODE=0
if [ -z "$DOMAIN" ] || [[ "$DOMAIN" =~ ^[0-9.]+$ ]]; then
  IPMODE=1
  DOMAIN="$(curl -4 -s --max-time 5 ifconfig.me || hostname -I | awk '{print $1}')"
fi
HERE="$(cd "$(dirname "$0")" && pwd)"
SITE=/var/www/vuonxanh

echo "==> 1/5 Cài Nginx và Certbot"
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx

echo "==> 2/5 Chép website vào $SITE"
mkdir -p "$SITE"
rm -rf "${SITE:?}"/*
cp -r "$HERE/web/." "$SITE/"
if [ "$IPMODE" = 1 ]; then grep -rl "https://__DOMAIN__" "$SITE" | xargs -r sed -i "s#https://__DOMAIN__#http://$DOMAIN#g"; fi
grep -rl "__DOMAIN__" "$SITE" | xargs -r sed -i "s/__DOMAIN__/$DOMAIN/g"
chown -R www-data:www-data "$SITE"

echo "==> 3/5 Cấu hình Nginx cho $DOMAIN"
if [ "$IPMODE" = 1 ]; then SERVERNAME="_"; else SERVERNAME="$DOMAIN www.$DOMAIN"; fi
# Chỉ nghe IPv6 nếu VPS có bật IPv6
if [ -f /proc/net/if_inet6 ]; then LISTEN6="listen [::]:80;"; else LISTEN6=""; fi
cat > /etc/nginx/sites-available/vuonxanh <<NGINX
server {
    listen 80;
    $LISTEN6
    server_name $SERVERNAME;
    root $SITE;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }
    error_page 404 /404.html;

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/xml text/plain;
    location ~* \.(css|js|svg)$ {
        expires 7d;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/vuonxanh /etc/nginx/sites-enabled/vuonxanh
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

echo "==> 4/5 Mở tường lửa (giữ cổng SSH để không bị khóa ngoài)"
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  ufw --force enable
fi

if [ "$IPMODE" = 1 ]; then
  echo ""
  echo "XONG! Mở trình duyệt vào:  http://$DOMAIN"
  echo "Khi đã có tên miền trỏ về IP này, chạy:  bash cai-dat.sh tenmien.com"
  exit 0
fi
echo "==> 5/5 Bật HTTPS (ổ khóa xanh)"
if [ -n "$EMAIL" ]; then MAILOPT="--email $EMAIL"; else MAILOPT="--register-unsafely-without-email"; fi
if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos $MAILOPT --redirect; then
  echo ""
  echo "XONG! Mở trình duyệt vào:  https://$DOMAIN"
else
  echo ""
  echo "Web đã chạy ở  http://$DOMAIN  nhưng CHƯA bật được HTTPS."
  echo "Thường do tên miền chưa trỏ xong về IP của VPS (kiểm tra ở dnschecker.org)."
  echo "Khi đã trỏ xong, chạy lại:  bash cai-dat.sh $DOMAIN"
fi
