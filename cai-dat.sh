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
cp "$HERE/may-chu/quan-tri.html" /opt/vuonxanh/quan-tri.html
mkdir -p /var/lib/vuonxanh/anh-tai-len

# Lệnh tạo / đổi mật khẩu / xóa tài khoản trang quản trị: vx-tai-khoan
cat > /usr/local/bin/vx-tai-khoan <<'TK'
#!/bin/bash
# Cách dùng:
#   vx-tai-khoan ten_dang_nhap        -> tạo tài khoản mới (hoặc đổi mật khẩu nếu đã có)
#   vx-tai-khoan --xoa ten_dang_nhap  -> xóa tài khoản
#   vx-tai-khoan --ds                 -> xem danh sách tài khoản
F=/etc/nginx/vuonxanh.htpasswd
touch "$F"
if [ "$1" = "--ds" ]; then cut -d: -f1 "$F"; exit 0; fi
if [ "$1" = "--xoa" ]; then
  [ -n "$2" ] || { echo "Thiếu tên tài khoản"; exit 1; }
  sed -i "/^$2:/d" "$F"; echo "Đã xóa tài khoản: $2"; exit 0
fi
U="$1"
if ! [[ "$U" =~ ^[a-z0-9_.-]{3,30}$ ]]; then echo "Tên đăng nhập chỉ gồm chữ thường không dấu, số, dấu chấm/gạch (3–30 ký tự)."; exit 1; fi
P="$(tr -dc 'A-HJ-NP-Za-km-z2-9' </dev/urandom | head -c 12)"
sed -i "/^$U:/d" "$F"
printf '%s:%s\n' "$U" "$(openssl passwd -apr1 "$P")" >> "$F"
chown root:www-data "$F"; chmod 640 "$F"
echo "Trang quản trị: https://$(cat /etc/vuonxanh-domain 2>/dev/null || echo tenmien)/quan-tri/"
echo "Tên đăng nhập: $U"
echo "Mật khẩu:      $P"
TK
chmod 755 /usr/local/bin/vx-tai-khoan

# Telegram (báo đơn), sao lưu, khôi phục
install -m 755 "$HERE/may-chu/vx-telegram.py" /usr/local/bin/vx-telegram
install -m 755 "$HERE/may-chu/vx-sao-luu.sh" /usr/local/bin/vx-sao-luu
install -m 755 "$HERE/may-chu/vx-khoi-phuc.sh" /usr/local/bin/vx-khoi-phuc
mkdir -p /var/backups/vuonxanh; chown root:www-data /var/backups/vuonxanh; chmod 750 /var/backups/vuonxanh
cat > /etc/systemd/system/vuonxanh-sao-luu.service <<UNIT
[Unit]
Description=Vuon Xanh - sao luu du lieu

[Service]
Type=oneshot
ExecStart=/usr/local/bin/vx-sao-luu
UNIT
cat > /etc/systemd/system/vuonxanh-sao-luu.timer <<UNIT
[Unit]
Description=Vuon Xanh - sao luu luc 2h30 sang moi ngay

[Timer]
OnCalendar=*-*-* 02:30:00 Asia/Ho_Chi_Minh
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now vuonxanh-sao-luu.timer >/dev/null 2>&1
[ -n "$(ls /var/backups/vuonxanh 2>/dev/null)" ] || /usr/local/bin/vx-sao-luu >/dev/null 2>&1 || true
echo "$DOMAIN" > /etc/vuonxanh-domain
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

    # Sitemap tự cập nhật khi thêm/xóa trang trong quản trị
    location = /sitemap.xml {
        alias /var/lib/vuonxanh/sitemap.xml;
        default_type application/xml;
        add_header Cache-Control "no-cache";
    }
    # Nội dung sửa từ trang quản trị
    location = /noi-dung.js {
        alias /var/lib/vuonxanh/noi-dung.js;
        default_type application/javascript;
        add_header Cache-Control "no-cache";
    }
    location ^~ /anh-tai-len/ {
        alias /var/lib/vuonxanh/anh-tai-len/;
        expires 30d;
    }
    # Sản phẩm / bài viết / dự án / danh mục: máy chủ chèn tiêu đề, mô tả SEO theo nội dung sửa trong quản trị.
    # Nếu chương trình máy chủ tạm dừng thì vẫn trả trang dựng sẵn.
    location ~ ^/((san-pham|bai-viet|du-an)-[0-9]+|danh-muc-[a-z0-9-]+)/?$ {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header X-Real-IP \$remote_addr;
        error_page 502 503 504 = @trang_tinh;
    }
    location @trang_tinh {
        try_files \$uri/index.html /index.html;
        add_header Cache-Control "no-cache";
    }
    location / {
        try_files \$uri \$uri/ =404;
        # Trang HTML: luôn hỏi lại máy chủ để khách thấy bản mới nhất
        add_header Cache-Control "no-cache";
    }
    location /anh/ {
        expires 1d;
    }
    error_page 404 /404.html;

    # Đánh giá của khách (có thể kèm 1 ảnh đã thu nhỏ)
    location = /api/danh-gia {
        limit_req zone=vxapi burst=3 nodelay;
        limit_req_status 429;
        client_max_body_size 3m;
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header X-Real-IP \$remote_addr;
    }
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
        client_max_body_size 10m;
        auth_basic "Quan tri Vuon Xanh";
        auth_basic_user_file /etc/nginx/vuonxanh.htpasswd;
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/xml text/plain;
    # CSS/JS có số phiên bản (?v=…) nên lưu lâu được; đổi nội dung là đổi số
    location ~* \.(css|js|svg)$ {
        expires 30d;
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
