// =====================================================================
//  DỮ LIỆU CỦA TOÀN BỘ WEBSITE
//  Sửa chữ, giá, thêm sản phẩm/bài viết… đều làm trong file này.
// =====================================================================

const SHOP = {
  name: "Vườn Xanh",
  hotline: "0987.123.456",
  email: "hoangnha0704@gmail.com",
  address: "Thái Bình",
  hours: "8h sáng đến 20h tất cả các ngày trong tuần",
};

// ---------- DANH MỤC ----------
// slug = phần sau dấu # trên thanh địa chỉ, ví dụ #danh-muc-kim-tien
const CATEGORIES = {
  "phong-thuy":     { name: "Cây Cảnh Phong Thủy", intro: "Những loại cây mang ý nghĩa tài lộc, bình an, được chọn theo tuổi và mệnh của gia chủ." },
  "trong-nha":      { name: "Cây Cảnh Trong Nhà", intro: "Cây chịu bóng tốt, sống khỏe trong phòng khách, phòng ngủ và căn hộ chung cư." },
  "de-ban":         { name: "Cây Cảnh Để Bàn", intro: "Cây nhỏ gọn đặt bàn làm việc, bàn học, kệ sách. Dễ chăm, ít tốn diện tích." },
  "van-phong":      { name: "Cây Cảnh Văn Phòng", intro: "Cây hợp điều hòa và ánh đèn, giúp văn phòng xanh mát và chuyên nghiệp hơn." },
  "loai-to":        { name: "Cây Cảnh Loại To", intro: "Cây cao từ 1m trở lên, đặt sảnh, góc phòng khách hoặc hai bên cửa ra vào." },
  "thuy-sinh":      { name: "Cây Thủy Sinh", intro: "Cây trồng trong nước, sạch sẽ, không cần đất, rất hợp để bàn." },
  "day-leo":        { name: "Cây Dây Leo", intro: "Cây leo giàn, leo tường, rủ ban công tạo mảng xanh mềm mại." },
  "xuong-rong":     { name: "Xương Rồng Cảnh", intro: "Xương rồng nhiều hình dáng, chịu hạn, rất ít phải tưới." },
  "cong-trinh":     { name: "Cây Công Trình", intro: "Cây số lượng lớn cho sân vườn, biệt thự, khu đô thị, nhà hàng." },
  "sen-da":         { name: "Cây Sen Đá", intro: "Sen đá mini nhiều màu sắc, hợp làm quà tặng và trang trí góc nhỏ." },
  "phu-kien":       { name: "Phụ Kiện", intro: "Chậu, dụng cụ, đất và phân bón để chăm cây tại nhà." },
  "kim-tien":       { name: "Cây Kim Tiền", intro: "Biểu tượng của tiền bạc và sự sung túc, rất dễ chăm." },
  "kim-ngan":       { name: "Cây Kim Ngân", intro: "Thân bện xoắn, mang ý nghĩa giữ tiền, giữ lộc." },
  "phat-tai":       { name: "Cây Phát Tài", intro: "Cây phát tài (thiết mộc lan) mang lại may mắn, thịnh vượng." },
  "hanh-phuc":      { name: "Cây Hạnh Phúc", intro: "Tán lá xanh mướt, tượng trưng cho gia đình êm ấm." },
  "trau-ba":        { name: "Cây Trầu Bà", intro: "Dễ sống, lọc không khí tốt, có loại để bàn, leo cột và thủy sinh." },
  "bang-singapore": { name: "Cây Bàng Singapore", intro: "Lá to bóng, dáng sang trọng, rất được ưa chuộng trong nội thất." },
  "luoi-ho":        { name: "Cây Lưỡi Hổ", intro: "Chịu bóng, chịu hạn, nhả oxy vào ban đêm, hợp phòng ngủ." },
  "phu-quy":        { name: "Cây Phú Quý", intro: "Lá viền đỏ hồng nổi bật, mang ý nghĩa phú quý, giàu sang." },
};

// Danh mục hiện ở cột trái trang chủ (máy tính)
const SIDE_CATS = ["phong-thuy", "trong-nha", "de-ban", "van-phong", "loai-to", "sen-da", "thuy-sinh", "xuong-rong", "cong-trinh"];
// Menu điện thoại "Danh mục sản phẩm" (mục cuối là trang dịch vụ)
const MOBILE_CATS = ["phong-thuy", "trong-nha", "de-ban", "van-phong", "loai-to", "thuy-sinh", "day-leo", "xuong-rong", "dich-vu", "cong-trinh"];
// "Cây mua nhiều" / "Cây cảnh ưa chuộng"
const BEST_CATS = ["kim-tien", "kim-ngan", "phat-tai", "sen-da", "hanh-phuc", "trau-ba", "bang-singapore", "luoi-ho", "phu-quy"];

// ---------- SẢN PHẨM ----------
// A(kiểu vẽ, nền, chậu, lá, lá phụ, hoa) – chỉ dùng cho hình minh hoạ
const A = (kind, bg, pot, leaf, leaf2, flower) => ({ kind, bg, pot, leaf, leaf2, flower });

const PRODUCTS = [
  { name: "Cây Nam Thiên Trúc", price: 799000, cats: ["phong-thuy", "loai-to", "cong-trinh"], size: "cao khoảng 100cm", light: "nắng nhẹ đến nắng trực tiếp", art: A("fern", "#f4f4f2", "#e9e4da", "#6aa335", "#9cc75a"), short: "Lá đổi màu theo mùa, cuối năm cho chùm quả đỏ rực. Cây mang ý nghĩa may mắn, bình an, hợp sân vườn, ban công và tiểu cảnh kiểu Nhật." },
  { name: "Cây Trúc Bách Hợp", price: 599000, cats: ["phong-thuy", "van-phong"], size: "cao 80–100cm", light: "ánh sáng tán xạ", art: A("tall", "#f2f4f0", "#ffffff", "#3c7a32", "#c9d86a"), short: "Lá dài viền vàng xếp tầng, dáng thanh lịch, hợp đặt góc phòng khách và văn phòng." },
  { name: "Cây hoa tường vi", price: 350000, cats: ["phong-thuy", "cong-trinh"], size: "cao 120–150cm", light: "nắng trực tiếp", art: A("flower", "#f6f0f2", "#c98d5f", "#3a7a32", "#5b9b44", "#e66a9a"), short: "Hoa nở thành chùm màu hồng tím suốt mùa hè, hợp trồng trước cổng và sân vườn." },
  { name: "Cây Hoa Giấy", price: 250000, cats: ["cong-trinh", "day-leo"], size: "cao 80–120cm", light: "nắng trực tiếp", art: A("flower", "#f7eef3", "#8a5a3c", "#2f7d2e", "#4f9c3c", "#c42b7f"), short: "Ra hoa quanh năm, chịu nắng chịu hạn tốt, rất hợp ban công hướng Tây." },
  { name: "Cây Huyết Dụ", price: 149000, cats: ["phong-thuy", "trong-nha"], size: "cao 60–80cm", light: "ánh sáng tán xạ", art: A("tall", "#f5efee", "#f1ede4", "#8c2a3c", "#c2455a"), short: "Lá màu đỏ tía nổi bật, theo dân gian giúp xua đuổi điều xấu, mang lại bình an." },
  { name: "Cây Cau Nga Mi", price: 650000, cats: ["loai-to", "cong-trinh"], size: "cao 150–180cm", light: "nắng nhẹ", art: A("fern", "#f0f3ee", "#ffffff", "#3b7a32", "#5d9b45"), short: "Dáng cau thanh mảnh, lá xòe mềm, tạo cảm giác nhiệt đới cho sảnh và sân vườn." },
  { name: "Cây Hạnh Phúc Gốc To", price: 2200000, cats: ["hanh-phuc", "loai-to", "van-phong", "phong-thuy"], size: "cao 180–200cm", light: "ánh sáng tán xạ", art: A("tree", "#f1f3ee", "#2f2f2f", "#2f7d2e", "#4f9c3c"), short: "Gốc to, tán dày, dáng cây chững chạc, hợp sảnh công ty và phòng khách rộng." },
  { name: "Cây Trúc Nhật Vàng", price: 125000, cats: ["trong-nha", "de-ban"], size: "cao 40–50cm", light: "ánh sáng tán xạ", art: A("tall", "#f5f4ec", "#e8e2d4", "#7fa33a", "#e3d25a"), short: "Lá đốm vàng tươi sáng, nhỏ gọn, rất hợp để bàn làm việc." },
  { name: "Sen Đá Casio", price: 15000, cats: ["sen-da", "de-ban"], size: "đường kính 5–7cm", light: "nắng nhẹ buổi sáng", art: A("rosette", "#eef1e8", "", "#7fae6a", "#b4d39a", "#e08aa0"), short: "Sen đá mini dễ thương, hợp làm quà tặng, gom thành chậu nhiều cây." },
  { name: "Chậu Sen Đá Vát", price: 129000, cats: ["sen-da", "de-ban"], size: "chậu 15cm", light: "nắng nhẹ buổi sáng", art: A("rosette", "#e9efee", "", "#6fa59a", "#a3cbc1", "#7f9a6a"), short: "Chậu vát xi măng trồng sẵn 3–4 cây sen đá nhiều màu, đặt kệ hoặc bàn." },
  { name: "Cây Hoa Dẻ Vàng", price: 399000, cats: ["day-leo", "cong-trinh"], size: "cao 120cm", light: "nắng trực tiếp", art: A("flower", "#f6f2e4", "#c98d5f", "#3a7a32", "#5b9b44", "#f2c84b"), short: "Dây leo cho hoa vàng thơm nhẹ, hợp leo giàn cổng và hàng rào." },
  { name: "Cây Monstera Albo", price: 550000, cats: ["trong-nha", "loai-to"], size: "cao 60–80cm", light: "ánh sáng tán xạ", art: A("leafy", "#eef1ec", "#e8e2d4", "#2d6b2f", "#e3ecd6"), short: "Lá xẻ khảm trắng độc đáo, là cây sưu tầm được nhiều người yêu thích." },
  { name: "Cây Kim Tiền Để Sàn", price: 450000, cats: ["kim-tien", "van-phong", "phong-thuy", "loai-to"], size: "cao 80–100cm", light: "ánh sáng tán xạ", art: A("leafy", "#eaf0e6", "#ffffff", "#2e7a2a", "#47963c"), short: "Cành vươn thẳng, lá xanh bóng, tượng trưng cho tiền tài. Rất bền trong văn phòng." },
  { name: "Cây Kim Tiền Để Bàn", price: 180000, cats: ["kim-tien", "de-ban", "phong-thuy"], size: "cao 30–40cm", light: "ánh sáng tán xạ", art: A("leafy", "#eef2ea", "#f4efdf", "#2e7a2a", "#47963c"), short: "Phiên bản nhỏ của kim tiền, đặt bàn làm việc hoặc quầy thu ngân." },
  { name: "Cây Kim Ngân 3 Thân", price: 390000, cats: ["kim-ngan", "van-phong", "phong-thuy"], size: "cao 70–90cm", light: "ánh sáng tán xạ", art: A("leafy", "#e9efe5", "#ffffff", "#3d8a2e", "#5aa83c"), short: "Ba thân bện xoắn chắc chắn, ý nghĩa giữ tiền giữ lộc cho gia chủ." },
  { name: "Cây Kim Ngân Để Bàn", price: 160000, cats: ["kim-ngan", "de-ban"], size: "cao 30cm", light: "ánh sáng tán xạ", art: A("leafy", "#f2f0e8", "#f4efdf", "#3d8a2e", "#5aa83c"), short: "Kim ngân mini chậu sứ, nhỏ xinh, hợp làm quà khai trương." },
  { name: "Cây Phát Tài Núi", price: 520000, cats: ["phat-tai", "phong-thuy", "van-phong"], size: "cao 100–120cm", light: "ánh sáng tán xạ", art: A("tall", "#eef0e8", "#8a5a3c", "#3c7a32", "#9bc25a"), short: "Nhiều thân xếp tầng như ngọn núi, tượng trưng cho sự vững vàng, thịnh vượng." },
  { name: "Cây Phát Tài Búp Sen", price: 220000, cats: ["phat-tai", "de-ban"], size: "cao 40–50cm", light: "ánh sáng tán xạ", art: A("tall", "#f1f2ea", "#ffffff", "#3c7a32", "#c9d86a"), short: "Lá xòe như búp sen, nhỏ gọn, hợp bàn làm việc và kệ tivi." },
  { name: "Cây Hạnh Phúc Để Bàn", price: 190000, cats: ["hanh-phuc", "de-ban"], size: "cao 40cm", light: "ánh sáng tán xạ", art: A("tree", "#eef2ea", "#ffffff", "#2f7d2e", "#4f9c3c"), short: "Tán lá nhỏ xanh mướt, hợp tặng tân gia, chúc gia đình hạnh phúc." },
  { name: "Cây Trầu Bà Leo Cột", price: 420000, cats: ["trau-ba", "day-leo", "van-phong"], size: "cao 100–120cm", light: "ánh sáng tán xạ", art: A("leafy", "#e5ede6", "#f1ede4", "#3a7a3a", "#5d9d4d"), short: "Trầu bà leo cột dừa, lá to xanh mát, lọc không khí tốt." },
  { name: "Cây Trầu Bà Thủy Sinh", price: 120000, cats: ["trau-ba", "thuy-sinh", "de-ban"], size: "cao 25–30cm", light: "ánh sáng tán xạ", art: A("leafy", "#eef3ec", "#cfe8ec", "#3f9a35", "#6fbd4b"), short: "Trồng trong bình thủy tinh, rễ trắng đẹp mắt, chỉ cần thay nước mỗi tuần." },
  { name: "Cây Bàng Singapore", price: 680000, cats: ["bang-singapore", "loai-to", "van-phong"], size: "cao 120–150cm", light: "ánh sáng mạnh, không gắt", art: A("tree", "#e6ece3", "#ffffff", "#2e6e2a", "#4b8f3b"), short: "Lá to hình đàn violin, dáng cây sang trọng, hợp phòng khách hiện đại." },
  { name: "Cây Bàng Singapore Mini", price: 210000, cats: ["bang-singapore", "de-ban"], size: "cao 40–50cm", light: "ánh sáng mạnh, không gắt", art: A("tree", "#eef1ea", "#e8e2d4", "#2e6e2a", "#4b8f3b"), short: "Bàng Singapore cỡ nhỏ để bàn, lá bóng đẹp, dễ phối nội thất." },
  { name: "Cây Lưỡi Hổ Vàng", price: 260000, cats: ["luoi-ho", "van-phong", "trong-nha"], size: "cao 60–70cm", light: "chịu bóng tốt", art: A("tall", "#eef0e6", "#d9cfc2", "#3e6e2f", "#c9c24a"), short: "Viền lá vàng, cứng cáp, nhả oxy ban đêm, rất hợp phòng ngủ." },
  { name: "Cây Lưỡi Hổ Thái", price: 150000, cats: ["luoi-ho", "de-ban"], size: "cao 30–40cm", light: "chịu bóng tốt", art: A("tall", "#ecefe8", "#ffffff", "#3e6e2f", "#93b860"), short: "Lá ngắn xếp hoa thị, nhỏ gọn để bàn, gần như không cần chăm." },
  { name: "Cây Phú Quý", price: 230000, cats: ["phu-quy", "de-ban", "phong-thuy"], size: "cao 30–40cm", light: "ánh sáng tán xạ", art: A("striped", "#f5ecea", "#ffffff", "#a54d3c", "#d1923f"), short: "Lá xanh viền đỏ hồng rực rỡ, mang ý nghĩa giàu sang phú quý." },
  { name: "Cây Phú Quý Để Sàn", price: 480000, cats: ["phu-quy", "van-phong"], size: "cao 60–70cm", light: "ánh sáng tán xạ", art: A("striped", "#f3ece4", "#e8e2d4", "#a54d3c", "#d1923f"), short: "Phú quý cỡ lớn nhiều thân, đặt sảnh lễ tân rất nổi bật." },
  { name: "Cây Lan Ý Thủy Sinh", price: 140000, cats: ["thuy-sinh", "de-ban"], size: "cao 30cm", light: "ánh sáng tán xạ", art: A("flower", "#e9eef0", "#e9f0f5", "#2c6b36", "#3d8746", "#ffffff"), short: "Hoa trắng thanh khiết, trồng bình thủy tinh, lọc không khí tốt." },
  { name: "Cây Kim Ngân Thủy Sinh", price: 130000, cats: ["thuy-sinh", "kim-ngan"], size: "cao 30cm", light: "ánh sáng tán xạ", art: A("leafy", "#e8f0f0", "#cfe8ec", "#3d8a2e", "#5aa83c"), short: "Kim ngân trồng nước, sạch sẽ, hợp bàn làm việc." },
  { name: "Xương Rồng Tai Thỏ", price: 60000, cats: ["xuong-rong", "de-ban"], size: "cao 10–15cm", light: "nắng trực tiếp", art: A("cactus", "#e4efe9", "#e8e4dc"), short: "Hình dáng như đôi tai thỏ ngộ nghĩnh, rất ít phải tưới nước." },
  { name: "Xương Rồng Trứng Chim", price: 45000, cats: ["xuong-rong"], size: "đường kính 6–8cm", light: "nắng trực tiếp", art: A("ball", "#ecf0e4", "#f7d9c4"), short: "Thân tròn phủ gai mềm, ra hoa nhỏ màu hồng vào mùa xuân." },
  { name: "Xương Rồng Kim Hổ", price: 90000, cats: ["xuong-rong"], size: "đường kính 10cm", light: "nắng trực tiếp", art: A("ball", "#f1ece6", "#ffffff"), short: "Gai vàng óng ánh, dáng tròn đều, ý nghĩa xua đuổi điều xấu." },
  { name: "Cây Đại Phú Gia", price: 900000, cats: ["van-phong", "loai-to", "cong-trinh"], size: "cao 150–170cm", light: "ánh sáng tán xạ", art: A("striped", "#e9efe6", "#2f2f2f", "#4c7f3e", "#6b9b55"), short: "Lá to sọc trắng, dáng cây bề thế, hợp sảnh và phòng giám đốc." },
  { name: "Kéo Cắt Tỉa Cây Cảnh", price: 60000, cats: ["phu-kien"], size: "dài 20cm", light: "", art: A("tool", "#eef1ea"), short: "Lưỡi thép sắc bén, tay cầm chống trượt, dùng tỉa cành và lá úa." },
  { name: "Chậu Sứ Trắng Trụ Tròn", price: 120000, cats: ["phu-kien"], size: "đường kính 20cm", light: "", art: A("potonly", "#f1f1ee", "#f4f4f4"), short: "Chậu sứ men trắng có lỗ thoát nước, hợp hầu hết các loại cây để bàn." },
  { name: "Chậu Composite Đen", price: 350000, cats: ["phu-kien"], size: "cao 40cm", light: "", art: A("potonly", "#efefef", "#262626"), short: "Chậu composite nhẹ, bền, chống nứt, dùng cho cây để sàn." },
  { name: "Tiểu Cảnh Terrarium Mini", price: 280000, cats: ["phu-kien", "de-ban"], size: "bình 15cm", light: "ánh sáng tán xạ", art: A("terra", "#eef3ef"), short: "Bình thủy tinh có rêu, đá và cây mini, như một khu vườn thu nhỏ." },
];
PRODUCTS.forEach((p, i) => { p.id = i; p.msp = 300 + i; p.stock = true; });

// Ảnh thật của sản phẩm: file nằm trong thư mục "anh", tên là sp-<số thứ tự>.webp
// Thêm số vào danh sách này khi có ảnh mới; sản phẩm chưa có ảnh sẽ dùng hình vẽ minh họa.
const ANH_SP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];
PRODUCTS.forEach((p) => { if (ANH_SP.includes(p.id)) p.art = { ...p.art, img: "/anh/sp-" + p.id + ".webp", alt: p.name }; });
// Dùng ảnh của sản phẩm số i cho bài viết, dự án, trang chăm sóc… (alt để trống vì ảnh chỉ minh họa)
const ANH = (i) => ({ ...PRODUCTS[i].art, alt: "" });

// ---------- BÀI VIẾT (TIN TỨC) ----------
// Mỗi bài: tiêu đề, mô tả ngắn, ngày, và các mục (h = tiêu đề mục, p = nội dung)
const POSTS = [
  { t: "Cây phù hợp phòng họp công ty: 15 lựa chọn đẹp và chuyên nghiệp", d: "20/11/2026", art: ANH(16),
    p: "Phòng họp là nơi diễn ra những cuộc trao đổi quan trọng. Một vài chậu cây đặt đúng chỗ giúp không gian chuyên nghiệp và dễ chịu hơn.",
    s: [["Vì sao nên đặt cây xanh trong phòng họp?", "Cây xanh làm dịu ánh sáng đèn, giảm cảm giác căng thẳng và giúp người tham dự tập trung hơn. Cây cũng tạo ấn tượng tốt với đối tác ngay khi bước vào."],
        ["Tiêu chí chọn cây", "Chọn cây có kích thước cân đối với diện tích phòng, dáng gọn gàng, chịu được điều hòa và ít phải chăm sóc."],
        ["Gợi ý các loại cây", "Kim tiền, kim ngân, bàng Singapore, đại phú gia, phát tài núi, trầu bà leo cột, lưỡi hổ và trúc bách hợp đều là lựa chọn bền và đẹp."]] },
  { t: "15 cây trồng phòng ngủ giúp không gian xanh mát và thư giãn hơn", d: "16/11/2026", art: ANH(27),
    p: "Phòng ngủ là nơi nghỉ ngơi sau một ngày dài. Chọn đúng loại cây giúp không khí trong lành và giấc ngủ ngon hơn.",
    s: [["Nguyên tắc chọn cây phòng ngủ", "Ưu tiên cây nhỏ, ít mùi, không có gai nhọn và chịu được ánh sáng yếu."],
        ["Những loại cây nên trồng", "Lưỡi hổ, lan ý, trầu bà, sen đá và kim ngân để bàn là những loại phổ biến và dễ chăm."],
        ["Vị trí đặt cây", "Đặt cây ở bệ cửa sổ hoặc kệ đầu giường, cách giường khoảng 1–2m để thoáng khí."]] },
  { t: "25 loại cây trồng nhà vệ sinh sống khỏe quanh năm", d: "12/11/2026", art: ANH(23),
    p: "Nhà vệ sinh có độ ẩm cao nhưng ít ánh sáng. Đây lại là môi trường hợp với nhiều loại cây nhiệt đới.",
    s: [["Đặc điểm môi trường nhà vệ sinh", "Độ ẩm cao, ít nắng, nhiệt độ thay đổi khi tắm nước nóng. Cây cần chịu bóng và ưa ẩm."],
        ["Các loại cây phù hợp", "Trầu bà, lưỡi hổ, dương xỉ, cây thủy sinh và lan ý sống rất khỏe trong nhà vệ sinh."],
        ["Lưu ý khi chăm", "Mỗi tuần mang cây ra chỗ sáng 1–2 ngày để cây quang hợp tốt hơn."]] },
  { t: "Cách nhận biết cây cảnh chịu được nắng", d: "08/11/2026", art: ANH(3),
    p: "Không phải cây nào cũng hợp ban công nắng gắt. Vài dấu hiệu đơn giản giúp bạn chọn đúng cây.",
    s: [["Lá dày và có lớp sáp", "Cây có lá dày, bóng hoặc phủ lớp sáp thường giữ nước tốt và chịu nắng."],
        ["Lá nhỏ hoặc có lông", "Lá nhỏ giúp giảm thoát hơi nước, lông mịn trên lá giúp phản xạ bớt ánh nắng."],
        ["Một số cây chịu nắng tiêu biểu", "Hoa giấy, xương rồng, sen đá, hoa tường vi và cau nga mi."]] },
  { t: "Nên tưới cây bằng nước máy hay nước đun sôi để nguội?", d: "04/11/2026", art: ANH(15),
    p: "Đây là câu hỏi rất nhiều người mới chơi cây thắc mắc. Mỗi loại nước có ưu và nhược điểm riêng.",
    s: [["Nước máy", "Tiện lợi nhưng có thể chứa clo. Nên để nước máy trong xô 1 ngày cho clo bay bớt rồi mới tưới."],
        ["Nước đun sôi để nguội", "Sạch vi khuẩn nhưng mất bớt oxy hòa tan, không cần thiết cho cây khỏe mạnh."],
        ["Lời khuyên", "Nước máy để qua đêm hoặc nước mưa sạch là lựa chọn tốt nhất cho hầu hết cây cảnh."]] },
  { t: "8 yếu tố giúp cây trồng trong nhà luôn xanh tốt", d: "30/10/2026", art: ANH(11),
    p: "Cây trong nhà cần được chăm đúng cách mới giữ được lá xanh lâu dài.",
    s: [["Ánh sáng và nước", "Đặt cây nơi có ánh sáng tán xạ, tưới khi mặt đất khô khoảng 2–3cm."],
        ["Đất, chậu và phân bón", "Dùng đất tơi xốp, chậu có lỗ thoát nước, bón phân loãng mỗi tháng một lần."],
        ["Vệ sinh lá và kiểm tra sâu bệnh", "Lau lá bằng khăn ẩm hàng tuần và kiểm tra mặt dưới lá để phát hiện rệp sớm."]] },
  { t: "Vì sao cây cảnh trong nhà bị vàng và nâu đầu lá?", d: "26/10/2026", art: ANH(1),
    p: "Lá vàng, cháy đầu lá là dấu hiệu cây đang gặp vấn đề. Tìm đúng nguyên nhân sẽ khắc phục được.",
    s: [["Tưới quá nhiều nước", "Rễ bị úng làm lá vàng từ dưới lên. Hãy giảm tưới và kiểm tra lỗ thoát nước."],
        ["Thiếu ánh sáng", "Cây để quá tối lâu ngày sẽ vàng lá. Mang cây ra chỗ sáng hơn."],
        ["Không khí khô do điều hòa", "Đầu lá nâu khô thường do không khí quá khô. Phun sương nhẹ cho lá mỗi ngày."]] },
  { t: "5 loại cây kim tiền phổ biến và hiếm gặp hiện nay", d: "22/10/2026", art: ANH(12),
    p: "Kim tiền có nhiều giống khác nhau về màu lá và kích thước. Cùng tìm hiểu để chọn loại hợp với bạn.",
    s: [["Kim tiền xanh", "Loại phổ biến nhất, lá xanh đậm bóng, rất dễ chăm."],
        ["Kim tiền đen và kim tiền vàng", "Hai giống hiếm hơn, màu lá lạ mắt, giá cao hơn kim tiền xanh."],
        ["Kim tiền mini để bàn", "Kích thước nhỏ, hợp bàn làm việc và quầy thu ngân."]] },
  { t: "Cách chăm sen đá vào mùa đông", d: "18/10/2026", art: ANH(8),
    p: "Mùa đông lạnh và ẩm là thời điểm sen đá dễ bị úng, thối gốc nhất.",
    s: [["Giảm lượng nước", "Chỉ tưới 7–10 ngày một lần, tưới vào gốc vào buổi trưa ấm."],
        ["Tăng ánh sáng", "Đặt sen đá nơi có nắng buổi sáng, tránh gió lạnh thổi trực tiếp."],
        ["Dùng đất thoát nước tốt", "Trộn thêm sỏi nhỏ hoặc đá trân châu để đất khô nhanh."]] },
];

// ---------- DỰ ÁN ----------
const PROJECTS = [
  { t: "[Dự án] Trang trí cây xanh cho biệt thự sân vườn", art: ANH(0), p: "Trong xã hội ngày càng phát triển, nhu cầu trang trí cây xanh trong các hộ gia đình đang dần trở thành xu hướng không thể thiếu…", plants: "Bàng Singapore, kim tiền, cau nga mi, hoa giấy" },
  { t: "[Dự án] Vườn đứng cho căn hộ chung cư", art: ANH(19), p: "Nhu cầu trang trí cây xanh trong căn hộ ngày càng lớn, đặc biệt với những không gian nhỏ cần tận dụng mảng tường…", plants: "Trầu bà, dương xỉ, lưỡi hổ, sen đá" },
  { t: "[Dự án] Cây xanh cho quán cà phê", art: ANH(21), p: "Trang trí cây xanh quán cà phê không chỉ đáp ứng nhu cầu thẩm mỹ mà còn mang lại nhiều lợi ích vượt trội cho khách…", plants: "Monstera, trầu bà leo cột, hoa giấy, cau nga mi" },
  { t: "[Dự án] Cây xanh cho phòng tập thể thao", art: ANH(24), p: "Cây xanh trong phòng tập giúp không gian thoáng hơn và tạo cảm giác thư giãn. Một trong những dự án tiêu biểu…", plants: "Đại phú gia, lưỡi hổ, bàng Singapore" },
  { t: "[Dự án] Cây xanh văn phòng công ty công nghệ", art: ANH(32), p: "Văn phòng mở 200m² cần mảng xanh để giảm căng thẳng cho nhân viên làm việc nhiều giờ trước máy tính…", plants: "Kim tiền, kim ngân, phát tài núi, lưỡi hổ" },
  { t: "[Dự án] Ban công xanh cho căn hộ cao tầng", art: ANH(2), p: "Ban công hướng Tây nắng gắt được cải tạo thành góc xanh với các loại cây chịu nắng, chịu gió…", plants: "Hoa giấy, hoa tường vi, xương rồng, sen đá" },
  { t: "[Dự án] Cung cấp cây xanh cho khu chung cư", art: ANH(6), p: "Cung cấp và trồng cây cho sảnh và khuôn viên chung cư, kèm gói chăm sóc định kỳ hàng tháng…", plants: "Cau nga mi, nam thiên trúc, hạnh phúc gốc to" },
  { t: "[Dự án] Trang trí cây cảnh cho nhà hàng", art: ANH(5), p: "Nhà hàng phong cách nhiệt đới cần nhiều cây lá to để tạo không gian gần gũi thiên nhiên…", plants: "Bàng Singapore, monstera, trầu bà, đại phú gia" },
];

// ---------- CÁCH CHĂM SÓC ----------
const CARE = {
  "cham-soc-van-phong": { name: "Cách chăm sóc cây cảnh văn phòng", art: ANH(14),
    intro: "Sau khi có cây văn phòng, điều nhiều người quan tâm nhất là chăm sóc thế nào để lá luôn xanh và cây không chết. Dưới đây là những kinh nghiệm cơ bản.",
    s: [["Tưới nước", "Tưới khi mặt đất khô khoảng 2–3cm, thường 1–2 lần mỗi tuần. Văn phòng có điều hòa làm đất khô chậm hơn bên ngoài, nên tránh tưới theo thói quen hàng ngày."],
        ["Đất", "Dùng đất trộn xơ dừa và phân hữu cơ để tơi xốp, thoát nước tốt. Thay đất 1 năm một lần."],
        ["Ánh sáng", "Đặt cây gần cửa sổ hoặc nơi có ánh đèn trắng. Mỗi tuần mang cây ra chỗ sáng 1 ngày nếu phòng quá tối."],
        ["Vị trí đặt cây", "Không đặt cây ngay dưới cửa gió điều hòa. Xoay chậu mỗi tuần để cây mọc đều các phía."],
        ["Những sai lầm thường gặp", "Tưới quá nhiều, đổ nước trà, cà phê thừa vào chậu, để cây trong phòng kín suốt kỳ nghỉ dài mà không ai tưới."]] },
  "cham-soc-thuy-sinh": { name: "Cách chăm sóc cây thủy sinh", art: ANH(20),
    intro: "Cây thủy sinh sạch sẽ và dễ trồng, nhưng vẫn cần chú ý vài điểm để rễ trắng khỏe và lá không bị vàng.",
    s: [["Thay nước", "Thay nước 5–7 ngày một lần. Nên dùng nước máy để qua đêm cho bay bớt clo."],
        ["Mực nước", "Chỉ ngâm 2/3 bộ rễ, để phần gốc thân trên mặt nước để cây thở được."],
        ["Dinh dưỡng", "Nhỏ vài giọt dung dịch thủy canh mỗi lần thay nước, không dùng phân bón cho cây trồng đất."],
        ["Vệ sinh rễ", "Cắt bỏ rễ thối, rễ đen. Rửa bình để tránh rêu bám."]] },
  "cham-soc-sen-da": { name: "Cách chăm sóc sen đá và xương rồng", art: ANH(9),
    intro: "Sen đá và xương rồng chịu hạn rất tốt. Phần lớn cây chết là do tưới quá nhiều chứ không phải do thiếu nước.",
    s: [["Ánh sáng", "Cần ít nhất 4 giờ nắng mỗi ngày. Thiếu nắng cây sẽ vươn dài, mất màu."],
        ["Tưới nước", "Tưới khi đất khô hoàn toàn, khoảng 5–7 ngày một lần. Tưới vào gốc, không tưới lên lá."],
        ["Đất trồng", "Dùng đất thoát nước nhanh: trộn đất, sỏi nhỏ, đá trân châu theo tỉ lệ bằng nhau."],
        ["Mùa mưa và mùa đông", "Giảm tưới, tránh để cây hứng mưa trực tiếp nhiều ngày liền."]] },
};

// ---------- CHÍNH SÁCH ----------
const POLICIES = {
  "chinh-sach-chung": { name: "Chính sách & quy định chung", s: [
    ["1. Phạm vi áp dụng", "Quy định này áp dụng cho mọi khách hàng mua sản phẩm và sử dụng dịch vụ tại cửa hàng và trên website."],
    ["2. Thông tin sản phẩm", "Hình ảnh mang tính minh họa. Kích thước và hình dáng cây thực tế có thể chênh lệch nhẹ do là cây sống."],
    ["3. Giá bán", "Giá niêm yết chưa bao gồm chi phí vận chuyển (nếu có). Giá có thể thay đổi theo mùa vụ."],
    ["4. Trách nhiệm", "Cửa hàng cam kết giao đúng sản phẩm đã xác nhận. Khách hàng có trách nhiệm cung cấp đúng thông tin nhận hàng."]] },
  "bao-hanh": { name: "Chính sách bảo hành", s: [
    ["1. Thời hạn bảo hành", "Cây cảnh được bảo hành 14 ngày kể từ lúc giao hàng. Cây công trình được bảo hành đến khi cây phát triển ổn định."],
    ["2. Điều kiện bảo hành", "Cây được chăm sóc theo hướng dẫn của cửa hàng, không bị tác động vật lý hoặc đặt sai vị trí đã tư vấn."],
    ["3. Không áp dụng bảo hành", "Cây bị gãy, đổ do va chạm; cây bị tưới hóa chất; cây đặt ngoài trời mưa bão."],
    ["4. Hỗ trợ trọn đời", "Khi cây có biểu hiện lạ, bạn chỉ cần chụp ảnh gửi qua Zalo để được tư vấn miễn phí."]] },
  "bao-mat": { name: "Chính sách bảo mật thông tin", s: [
    ["1. Thông tin thu thập", "Họ tên, số điện thoại, email và địa chỉ giao hàng khi bạn đặt hàng hoặc gửi liên hệ."],
    ["2. Mục đích sử dụng", "Chỉ dùng để xác nhận đơn hàng, giao hàng và chăm sóc khách hàng."],
    ["3. Cam kết", "Không bán, chia sẻ thông tin cho bên thứ ba, trừ đơn vị vận chuyển để giao hàng."],
    ["4. Yêu cầu xóa thông tin", "Bạn có thể liên hệ hotline để yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân."]] },
  "doi-tra": { name: "Chính sách đổi trả hàng", s: [
    ["1. Trường hợp được đổi trả", "Giao sai loại cây, sai kích thước; cây bị hỏng, dập nát khi nhận hàng; chậu bị vỡ, nứt do vận chuyển."],
    ["2. Thời gian đổi trả", "Trong vòng 3 ngày kể từ khi nhận hàng. Vui lòng chụp ảnh ngay khi mở hàng."],
    ["3. Cách thức", "Liên hệ hotline hoặc Zalo, cửa hàng sẽ đổi cây mới hoặc hoàn tiền theo thỏa thuận."],
    ["4. Chi phí", "Miễn phí đổi trả nếu lỗi từ cửa hàng. Đổi theo nhu cầu khách hàng thì khách chịu phí vận chuyển."]] },
  "giao-hang": { name: "Chính sách giao hàng", s: [
    ["1. Khu vực giao hàng", "Giao nội thành trong ngày. Giao tỉnh qua đơn vị vận chuyển từ 2–4 ngày."],
    ["2. Phí giao hàng", "Miễn phí nội thành với đơn từ 500.000đ. Đơn nhỏ hơn tính phí theo khoảng cách."],
    ["3. Đóng gói", "Cây được bọc giấy và cố định trong thùng, chậu sứ có xốp chống va đập."],
    ["4. Nhận hàng", "Bạn được kiểm tra cây trước khi thanh toán."]] },
  "huong-dan-mua-hang": { name: "Hướng dẫn mua hàng", s: [
    ["Cách 1: Mua trực tiếp tại cửa hàng", "Đến cửa hàng để chọn cây và chậu ưng ý. Địa chỉ: " + SHOP.address + ". Hotline: " + SHOP.hotline + "."],
    ["Cách 2: Đặt hàng trên website", "Chọn sản phẩm, bấm \"Thêm vào giỏ\", vào mục Mua hàng, điền thông tin nhận hàng và bấm \"Đặt hàng\". Cửa hàng sẽ gọi lại xác nhận."],
    ["Cách 3: Đặt qua điện thoại hoặc Zalo", "Gọi hoặc nhắn Zalo số " + SHOP.hotline + ", gửi tên cây hoặc ảnh mẫu bạn thích."],
    ["Thanh toán", "Thanh toán tiền mặt khi nhận hàng hoặc chuyển khoản sau khi cửa hàng xác nhận đơn."]] },
};

// ---------- DỊCH VỤ CHĂM SÓC (giá tham khảo, bạn tự sửa) ----------
const SERVICE = {
  benefits: ["Thợ chăm sóc định kỳ tưới nước, cắt tỉa, lau lá, bón phân", "Thay cây mới miễn phí nếu cây hỏng (gói có thay mới)", "Báo cáo tình trạng cây sau mỗi lần chăm", "Tư vấn bố trí lại cây theo mùa"],
  table: [["Dưới 20 cây", "2 lần/tháng", "600.000đ"], ["20 – 50 cây", "4 lần/tháng", "1.200.000đ"], ["50 – 100 cây", "4 lần/tháng", "2.000.000đ"], ["Trên 100 cây", "Theo thỏa thuận", "Liên hệ"]],
  faq: [["Cây hỏng, chết có được thay mới không?", "Với gói có thay mới, cây hỏng được thay miễn phí trong lần chăm kế tiếp."],
        ["Quy trình chăm sóc thế nào?", "Kiểm tra đất, tưới nước, cắt lá úa, lau lá, bón phân định kỳ và xử lý sâu bệnh nếu có."],
        ["Có xuất hóa đơn không?", "Có, cửa hàng xuất hóa đơn theo yêu cầu của doanh nghiệp."],
        ["Thanh toán như thế nào?", "Thanh toán theo tháng bằng chuyển khoản."]],
};

// ---------- ĐÁNH GIÁ (NỘI DUNG MẪU – thay bằng đánh giá thật) ----------
const REVIEWS = [
  { name: "Khách hàng A – Hà Nội", q: "Cây giao đến tươi, đóng gói cẩn thận. Shop còn hướng dẫn cách tưới nước rất kỹ.", chat: ["Cây đẹp lắm shop ơi", "Dạ cảm ơn anh ạ"] },
  { name: "Khách hàng B – Hà Nội", q: "Mình đặt cây cho văn phòng, nhân viên tư vấn chọn loại hợp ánh sáng nên cây lên rất đẹp.", chat: ["Rất ưng ý ạ", "Dạ shop cảm ơn chị"] },
  { name: "Khách hàng C – Hưng Yên", q: "Đặt buổi sáng, chiều đã có cây. Chậu đẹp, giá hợp lý, sẽ ủng hộ tiếp.", chat: ["Giao nhanh quá", "Dạ hẹn gặp lại anh"] },
  { name: "Khách hàng D – TP. Hồ Chí Minh", q: "Đặt online mà cây đến vẫn xanh tốt, không dập lá. Rất hài lòng.", chat: ["Cây về rồi nhé shop", "Dạ shop cảm ơn chị"] },
  { name: "Khách hàng E – Hà Nội", q: "Nhân viên tư vấn nhiệt tình, chọn cây hợp mệnh cho mình.", chat: ["Cây hợp phòng lắm", "Dạ cảm ơn chị ạ"] },
  { name: "Khách hàng F – TP. Hồ Chí Minh", q: "Mua làm quà tặng, được gói đẹp và kèm thiệp. Sẽ quay lại.", chat: ["Bạn mình thích lắm", "Dạ vui quá ạ"] },
];

// Ô "Danh mục cây cảnh" trên trang chủ
const TILES = [
  ["de-ban", A("rosette", "#cfe0c4", "", "#7fae6a", "#b4d39a", "#e08aa0")],
  ["phong-thuy", A("leafy", "#d9e6d2", "#f4efdf", "#3d8a2e", "#5aa83c")],
  ["trong-nha", A("striped", "#cddccf", "#ffffff", "#2f6b3a", "#4f8f55")],
  ["sen-da", A("rosette", "#d8d0c4", "", "#8fb4a3", "#b8d3c6", "#b5838f")],
  ["van-phong", A("tall", "#c9d6d9", "#ffffff", "#3e6e2f", "#c9c24a")],
  ["thuy-sinh", A("leafy", "#d6e4e4", "#cfe8ec", "#3f9a35", "#6fbd4b")],
  ["xuong-rong", A("ball", "#4a3f45", "#c98d5f")],
  ["phu-kien", A("tool", "#a9c58a")],
];
