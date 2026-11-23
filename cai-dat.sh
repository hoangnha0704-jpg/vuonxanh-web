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

echo "==> Cài chương trình nhận đơn hàng, tư vấn, đăng ký email"
# Dữ liệu khách nằm ở /var/lib/vuonxanh (không bị xóa khi cập nhật web)
mkdir -p /opt/vuonxanh /var/lib/vuonxanh
cp "$HERE/may-chu/nhan-du-lieu.py" /opt/vuonxanh/nhan-du-lieu.py
chown -R www-data:www-data /var/lib/vuonxanh
chmod 750 /var/lib/vuonxanh
cat > /etc/systemd/system/vuonxanh-api.service <<UNIT
[Unit]
Description=Vuon Xanh - nhan du lieu khach
After=network.target

[Service]
User=www-data
Group=www-data
ExecStart=/usr/bin/python3 /opt/vuonxanh/nhan-du-lieu.py
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/var/lib/vuonxanh
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable vuonxanh-api >/dev/null 2>&1
systemctl restart vuonxanh-api

# Mật khẩu trang quản trị: tạo 1 lần, lần cập nhật sau giữ nguyên
PASSFILE=/root/vuonxanh-quan-tri.txt
if [ ! -f /etc/nginx/vuonxanh.htpasswd ] || [ ! -f "$PASSFILE" ]; then
  ADMINPASS="$(tr -dc 'A-HJ-NP-Za-km-z2-9' </dev/urandom | head -c 12)"
  printf 'admin:%s\n' "$(openssl passwd -apr1 "$ADMINPASS")" > /etc/nginx/vuonxanh.htpasswd
  printf 'Trang quan tri: /quan-tri/\nTen dang nhap: admin\nMat khau: %s\n' "$ADMINPASS" > "$PASSFILE"
  chmod 600 "$PASSFILE"
fi
chown root:www-data /etc/nginx/vuonxanh.htpasswd
chmod 640 /etc/nginx/vuonxanh.htpasswd

echo "==> 3/5 Cấu hình Nginx cho $DOMAIN"
if [ "$IPMODE" = 1 ]; then SERVERNAME="_"; else SERVERNAME="$DOMAIN www.$DOMAIN"; fi
# Chỉ nghe IPv6 nếu VPS có bật IPv6
if [ -f /proc/net/if_inet6 ]; then LISTEN6="listen [::]:80;"; else LISTEN6=""; fi
cat > /etc/nginx/sites-available/vuonxanh <<NGINX
# Chống gửi ồ ạt: mỗi IP tối đa 10 lần gửi/phút
limit_req_zone \$binary_remote_addr zone=vxapi:1m rate=10r/m;

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

    # Nhận đơn hàng, tư vấn, đăng ký email
    location /api/ {
        limit_req zone=vxapi burst=5 nodelay;
        limit_req_status 429;
        client_max_body_size 32k;
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    # Trang xem dữ liệu khách (có mật khẩu)
    location /quan-tri/ {
        auth_basic "Quan tri Vuon Xanh";
        auth_basic_user_file /etc/nginx/vuonxanh.htpasswd;
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header X-Real-IP \$remote_addr;
    }

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
  echo "Xem đơn hàng / khách đăng ký: http://$DOMAIN/quan-tri/"; cat "$PASSFILE"
  echo "Khi đã có tên miền trỏ về IP này, chạy:  bash cai-dat.sh tenmien.com"
  exit 0
fi
echo "==> 5/5 Bật HTTPS (ổ khóa xanh)"
if [ -n "$EMAIL" ]; then MAILOPT="--email $EMAIL"; else MAILOPT="--register-unsafely-without-email"; fi
if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos $MAILOPT --redirect; then
  echo ""
  echo "XONG! Mở trình duyệt vào:  https://$DOMAIN"
  echo ""
  echo "Xem đơn hàng / khách đăng ký:  https://$DOMAIN/quan-tri/"
  cat "$PASSFILE"
else
  echo ""
  echo "Web đã chạy ở  http://$DOMAIN  nhưng CHƯA bật được HTTPS."
  echo "Thường do tên miền chưa trỏ xong về IP của VPS (kiểm tra ở dnschecker.org)."
  echo "Khi đã trỏ xong, chạy lại:  bash cai-dat.sh $DOMAIN"
fi
