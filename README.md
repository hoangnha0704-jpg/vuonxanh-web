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

## Đơn hàng, yêu cầu tư vấn, email đăng ký
- `may-chu/nhan-du-lieu.py` – chương trình nhỏ chạy trên VPS (dịch vụ `vuonxanh-api`), lưu dữ liệu khách vào `/var/lib/vuonxanh/khach.db`
- Xem dữ liệu: `https://tenmien/quan-tri/` (tên đăng nhập `admin`, mật khẩu xem bằng lệnh `cat /root/vuonxanh-quan-tri.txt` trên VPS)
- Cập nhật web không làm mất dữ liệu khách

## Trang quản trị nội dung (cho chủ cửa hàng)
- `https://tenmien/quan-tri/`: tab **Danh mục** (thêm/sửa/xóa danh mục, chọn hiện ở cột "Theo loại cây" hay "Cây mua nhiều"), tab **Sản phẩm** (sửa ảnh, tên, giá, mô tả, danh mục, còn/hết hàng, bán chạy, thêm/xóa), tab **Bài viết tin tức** (viết/sửa/xóa bài), tab **Đơn hàng & khách**
- Bấm Lưu là web đổi ngay, không cần chạy lệnh. Dữ liệu sửa nằm ở `/var/lib/vuonxanh/noi-dung.json` (bản sao lưu: `noi-dung.json.bak`), ảnh tải lên ở `/var/lib/vuonxanh/anh-tai-len/`
- Cập nhật mã nguồn (chạy lại `cai-dat.sh`) không làm mất nội dung đã sửa
- Tài khoản: `vx-tai-khoan tenkhach` (tạo hoặc đổi mật khẩu), `vx-tai-khoan --ds` (danh sách), `vx-tai-khoan --xoa tenkhach` (xóa)
- Lưu ý cho người sửa mã: sản phẩm và bài viết được nhận diện theo **số thứ tự** trong `data.js`. Đừng xóa hay chèn giữa danh sách, chỉ thêm vào cuối, nếu không nội dung đã sửa sẽ lệch sang sản phẩm khác.
