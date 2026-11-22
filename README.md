# Vườn Xanh – website cây cảnh

## Cài lên VPS (Ubuntu)
Đăng nhập VPS rồi chạy 1 dòng:

```bash
curl -sL https://github.com/hoangnha0704-jpg/vuonxanh-web/archive/main.tar.gz | tar xz && bash vuonxanh-web-main/cai-dat.sh
```

Khi đã có tên miền trỏ về VPS, chạy lại và thêm tên miền ở cuối:

```bash
bash vuonxanh-web-main/cai-dat.sh tenmien.com
```

## Thư mục
- `web/` – bản website đã dựng sẵn (95 trang, sitemap.xml, robots.txt)
- `nguon/` – mã nguồn; sửa nội dung trong `nguon/data.js`, rồi chạy `node nguon/xay-dung.js` để dựng lại
- `cai-dat.sh` – tự cài Nginx, đưa web lên và bật HTTPS
