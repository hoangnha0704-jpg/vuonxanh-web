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
- `https://tenmien/quan-tri/`: tab **Danh mục** (thêm/sửa/xóa danh mục, chọn hiện ở cột "Theo loại cây" hay "Cây mua nhiều"), tab **Sản phẩm** (sửa ảnh, tên, giá, mô tả, danh mục, còn/hết hàng, bán chạy, thêm/xóa), tab **Bài viết tin tức** (viết/sửa/xóa bài), tab **Dự án** (bài chia sẻ công trình kèm nhiều ảnh), tab **Đơn hàng & khách**
- Bấm Lưu là web đổi ngay, không cần chạy lệnh. Dữ liệu sửa nằm ở `/var/lib/vuonxanh/noi-dung.json` (bản sao lưu: `noi-dung.json.bak`), ảnh tải lên ở `/var/lib/vuonxanh/anh-tai-len/`
- Cập nhật mã nguồn (chạy lại `cai-dat.sh`) không làm mất nội dung đã sửa
- Tài khoản: `vx-tai-khoan tenkhach` (tạo hoặc đổi mật khẩu), `vx-tai-khoan --ds` (danh sách), `vx-tai-khoan --xoa tenkhach` (xóa)
- Lưu ý cho người sửa mã: sản phẩm và bài viết được nhận diện theo **số thứ tự** trong `data.js`. Đừng xóa hay chèn giữa danh sách, chỉ thêm vào cuối, nếu không nội dung đã sửa sẽ lệch sang sản phẩm khác.

## Báo đơn qua Telegram, sao lưu, sitemap
- `vx-telegram MÃ_BOT`: kết nối bot Telegram (tạo bot bằng @BotFather). `vx-telegram --them` thêm người nhận, `--ds` xem danh sách, `--thu` gửi thử, `--tat` tắt
- Có đơn hàng / yêu cầu tư vấn / email đăng ký là Telegram báo ngay
- Sao lưu tự động 2h30 sáng mỗi ngày vào `/var/backups/vuonxanh` (giữ 14 ngày), gửi file qua Telegram; tải bản mới nhất ở tab "Đơn hàng & khách"
- `vx-sao-luu`: sao lưu ngay. `vx-khoi-phuc`: xem danh sách, `vx-khoi-phuc TÊN_FILE`: khôi phục
- `sitemap.xml` tự cập nhật khi thêm/xóa sản phẩm, bài viết, dự án, danh mục trong trang quản trị

## SEO trong trang quản trị
- Mỗi sản phẩm, danh mục, bài viết, dự án có khung **Tối ưu SEO**: từ khóa chính, tiêu đề SEO, mô tả SEO, chữ mô tả ảnh (alt), xem trước trên Google và điểm SEO (0–100) kèm từng tiêu chí
- Máy chủ chèn tiêu đề, mô tả, og:image, canonical, JSON-LD (Product/Article) vào trang khi phục vụ, nên Google, Facebook, Zalo đều thấy nội dung mới. Trang đã xóa trả về 404

## Quản lý đơn hàng & doanh thu (tab "Đơn hàng & khách")
- Trạng thái đơn: Mới → Đã xác nhận → Đang giao → Đã giao / Đã hủy (nút bước tiếp trên mỗi đơn); ghi chú nội bộ; gọi / Zalo / sao chép thông tin giao hàng
- Thẻ tổng quan (đơn mới, đang giao, đã giao tháng này, doanh thu tháng này so với tháng trước) và biểu đồ doanh thu 12 tháng – **chỉ tính đơn đã giao, theo ngày giao**
- Lọc theo trạng thái / tháng, tìm theo mã đơn, tên, số điện thoại, sản phẩm; tải Excel (có cột trạng thái, ngày giao)
- Yêu cầu tư vấn: Mới / Đã liên hệ / Xong / Bỏ qua + ghi chú. Email đăng ký: sao chép tất cả, tải Excel
- CSDL cũ được tự nâng cấp (thêm cột trạng thái, tổng tiền dạng số…) khi chương trình khởi động

## Giao diện (tab "Giao diện" trong quản trị)
- Sửa dòng thông báo đầu trang (khuyến mãi, phí giao, nghỉ lễ)
- Bật/tắt giao diện Tết: điểm nhấn đỏ son – vàng đồng, hoa mai/lì xì ở banner

## Tăng niềm tin & chuyển đổi
- **Thông tin chăm sóc từng cây**: độ khó, tưới nước, an toàn thú cưng, chiều cao khi trưởng thành (mặc định theo loại cây trong `data.js` → `CHAM_THEO_LOAI`, sửa riêng trong quản trị)
- **Nhiều ảnh mỗi sản phẩm** (tối đa 12, tải trong quản trị)
- **Đánh giá của khách**: khách gửi sao + nhận xét + ảnh ở trang sản phẩm → báo Telegram → duyệt/ẩn/phản hồi/xóa ở tab "Đơn hàng & khách" → hiện trên web, điểm sao trên thẻ sản phẩm, mục "Khách hàng nói gì" ở trang chủ, điểm đánh giá trong dữ liệu Google
- **Tab Cài đặt**: dòng thông báo, giao diện Tết, giờ chốt đơn giao trong ngày, mã QR chuyển khoản (VietQR), Google Analytics 4 (page_view, view_item, add_to_cart, begin_checkout, purchase)
- **Chọn cây giúp tôi** (`/chon-cay/`): 4 câu hỏi → gợi ý 4 cây kèm lý do
