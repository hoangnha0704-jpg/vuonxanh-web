// =====================================================================
//  ĐIỀU KHIỂN WEBSITE: vẽ từng trang, chuyển trang, giỏ hàng, biểu mẫu
//  Nội dung (sản phẩm, bài viết, chính sách…) nằm trong data.js
// =====================================================================
const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString("vi-VN") + "₫";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const catName = (s) => (s === "dich-vu" ? "Dịch vụ chăm sóc cây" : CATEGORIES[s].name);
const catHref = (s) => (s === "dich-vu" ? "#dich-vu-cham-soc" : `#danh-muc-${s}`);
const prodHref = (p) => `#san-pham-${p.id}`;
const count = (s) => PRODUCTS.filter((p) => p.cats.includes(s)).length;
const PHOTO = "#f1efe9";                                   // nền ảnh sản phẩm thống nhất
const photo = (a, bg = PHOTO) => (a.img ? `<img class="art photo" src="${a.img}" alt="${esc(a.alt || "")}" loading="lazy" decoding="async" width="408" height="408">` : art({ ...a, bg }));

// Cây bán chạy (số thứ tự trong PRODUCTS) – sửa tùy ý
const HOT = [12, 14, 21, 23, 6, 19, 25, 16, 1, 0, 20, 4];
const isHot = (p) => HOT.includes(p.id);
const isNew = (p) => p.id < 8;

// Điền thông tin cửa hàng
document.querySelectorAll(".js-hotline").forEach((e) => (e.textContent = SHOP.hotline));
document.querySelectorAll(".js-address").forEach((e) => (e.textContent = SHOP.address));
document.querySelectorAll(".js-email").forEach((e) => (e.textContent = SHOP.email));

// ---------------------------------------------------------------------
// MẪU DÙNG CHUNG
// ---------------------------------------------------------------------
function card(p) {
  const badge = isHot(p) ? `<span class="badge hot">Bán chạy</span>` : isNew(p) ? `<span class="badge">Mới về</span>` : "";
  return `<article class="card">
    <div class="card-img"><a href="${prodHref(p)}" class="card-link" aria-label="${p.name}">${photo(p.art)}</a>${badge}
      <button class="quick-add" data-add="${p.id}" aria-label="Thêm ${p.name} vào giỏ">Thêm vào giỏ</button></div>
    <div class="card-body">
      <span class="card-cat">${CATEGORIES[p.cats[0]].name}</span>
      <a href="${prodHref(p)}" class="card-name">${p.name}</a>
      <span class="card-meta">${p.size}${p.light ? " · " + p.light : ""}</span>
      <span class="card-price">${fmt(p.price)}</span>
    </div>
  </article>`;
}
const grid = (list, cls = "") => `<div class="grid ${cls}">${list.map(card).join("")}</div>`;
const postCard = (x, href) => `<article class="post-card">
  <a href="${href}" class="post-img">${photo(x.art, x.art.bg)}</a>
  ${x.d ? `<time>${x.d}</time>` : ""}<a href="${href}"><h3>${x.t}</h3></a><p>${x.p}</p></article>`;
const mini = (p) => `<a href="${prodHref(p)}" class="mini-item"><span class="mini-img">${photo(p.art)}</span><span><b>${p.name}</b><span>${fmt(p.price)}</span></span></a>`;
const faq = (list) => `<div class="faq">${list.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`;
const sections = (list) => list.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join("");
const head = (title, crumbs = [], lead = "") => `<div class="container page-head">
  <nav class="crumbs" aria-label="Đường dẫn"><a href="#trang-chu">Trang chủ</a>${crumbs.map(([t, h]) => `<span>/</span><a href="${h}">${t}</a>`).join("")}<span>/</span><span>${title}</span></nav>
  <h1 class="page-title">${title}</h1>${lead ? `<p class="page-lead">${lead}</p>` : ""}</div>`;
const sideCard = () => `<aside>
  <div class="side-card"><h4>Cây được quan tâm</h4>${HOT.slice(0, 4).map((i) => mini(PRODUCTS[i])).join("")}<a href="#san-pham" class="btn btn-outline">Xem tất cả cây</a></div>
  <div class="side-cta">Cần tư vấn chọn cây?<b>${SHOP.hotline}</b><small>${SHOP.hours}</small></div></aside>`;
const moreProducts = (title = "Có thể bạn thích", list = HOT.slice(0, 4).map((i) => PRODUCTS[i])) =>
  `<section class="section tight"><div class="container"><div class="sec-head"><h2 class="h2">${title}</h2><a href="#san-pham" class="link-arrow">Xem tất cả</a></div>${grid(list)}</div></section>`;

// ---------------------------------------------------------------------
// MENU
// ---------------------------------------------------------------------
const TYPE_CATS = ["phong-thuy", "trong-nha", "de-ban", "van-phong", "loai-to", "thuy-sinh", "day-leo", "xuong-rong", "sen-da", "cong-trinh", "phu-kien"];
const firstOf = (s) => PRODUCTS.find((p) => p.cats.includes(s));
$("megaMenu").innerHTML = `
  <div><h5>Theo loại cây</h5><div class="mega-links">${TYPE_CATS.map((s) => `<a href="${catHref(s)}"><span class="mini">${photo(firstOf(s).art)}</span>${catName(s)}</a>`).join("")}<a href="#dich-vu-cham-soc"><span class="mini">${photo(A("tree", "", "#fff", "#2e6e2a", "#4b8f3b"))}</span>Dịch vụ chăm sóc cây</a></div></div>
  <div><h5>Cây mua nhiều</h5><div class="mega-links">${BEST_CATS.map((s) => `<a href="${catHref(s)}"><span class="mini">${photo(firstOf(s).art)}</span>${catName(s)}</a>`).join("")}</div></div>
  <div><h5>Nổi bật tuần này</h5><a href="${prodHref(PRODUCTS[21])}" class="mega-feature"><span class="mf-img">${photo(PRODUCTS[21].art, "#e8efe3")}</span>
    <div><b>${PRODUCTS[21].name}</b><span>${fmt(PRODUCTS[21].price)}</span></div></a>
    <p style="margin-top:12px"><a href="#san-pham" class="link-arrow">Xem tất cả ${PRODUCTS.length} sản phẩm</a></p></div>`;
$("careMenu").innerHTML = Object.entries(CARE).map(([k, c]) => `<a href="#${k}">${c.name.replace("Cách chăm sóc ", "")}</a>`).join("") + `<a href="#dich-vu-cham-soc">Dịch vụ chăm sóc định kỳ</a>`;
$("policyMenu").innerHTML = Object.entries(POLICIES).map(([k, v]) => `<a href="#${k}">${v.name}</a>`).join("");
$("fCats").innerHTML = ["kim-tien", "van-phong", "de-ban", "phong-thuy", "loai-to", "sen-da"].map((s) => `<li><a href="${catHref(s)}">${catName(s)}</a></li>`).join("");
$("fHelp").innerHTML = [["#huong-dan-mua-hang", "Hướng dẫn mua hàng"], ["#giao-hang", "Giao hàng"], ["#bao-hanh", "Bảo hành"], ["#doi-tra", "Đổi trả"], ["#cham-soc", "Cách chăm sóc cây"], ["#lien-he", "Liên hệ"]]
  .map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("");

function closeMenu() { $("nav").classList.remove("open"); $("overlay").classList.remove("show"); }
$("menuToggle").onclick = () => { $("nav").classList.add("open"); $("overlay").classList.add("show"); };
$("overlay").onclick = closeMenu;

// ---------------------------------------------------------------------
// GIỎ HÀNG (lưu trong trình duyệt người xem)
// ---------------------------------------------------------------------
let cart = {};
try { cart = JSON.parse(localStorage.getItem("vx-cart") || "{}"); } catch (e) { cart = {}; }
const saveCart = () => { try { localStorage.setItem("vx-cart", JSON.stringify(cart)); } catch (e) {} };
const items = () => Object.entries(cart).filter(([id, q]) => PRODUCTS[id] && q > 0).map(([id, q]) => ({ p: PRODUCTS[id], q }));
const total = () => items().reduce((s, x) => s + x.p.price * x.q, 0);
const qtyAll = () => items().reduce((s, x) => s + x.q, 0);
function updateCart() { $("cartQty").textContent = qtyAll(); }
function addToCart(id, q = 1) {
  cart[id] = (cart[id] || 0) + q; saveCart(); updateCart();
  const c = $("cartBtn"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  toast(`Đã thêm <b>${PRODUCTS[id].name}</b> vào giỏ`, `<a href="#mua-hang">Xem giỏ →</a>`);
}
function toast(msg, action = "") {
  const t = $("toast"); t.innerHTML = `<span>${msg}</span>${action}`; t.classList.add("show");
  clearTimeout(t.timer); t.timer = setTimeout(() => t.classList.remove("show"), 3000);
}
updateCart();

// ---------------------------------------------------------------------
// TRANG CHỦ
// ---------------------------------------------------------------------
let homeFilter = "all";
const HOME_TABS = [["all", "Tất cả"], ["de-ban", "Để bàn"], ["van-phong", "Văn phòng"], ["phong-thuy", "Phong thủy"], ["loai-to", "Loại to"]];
const homeHot = () => (homeFilter === "all" ? HOT.map((i) => PRODUCTS[i]) : PRODUCTS.filter((p) => p.cats.includes(homeFilter)).sort((a, b) => isHot(b) - isHot(a))).slice(0, 8);

function homePage() {
  const h = [PRODUCTS[21], PRODUCTS[12], PRODUCTS[9]];
  const chips = ["kim-tien", "luoi-ho", "trau-ba", "bang-singapore", "de-ban", "sen-da", "thuy-sinh", "loai-to"];
  const room = (s, title, text, a) => `<a href="${catHref(s)}" class="room">${photo(a, a.bg)}<span class="room-text"><b>${title}</b><span>${text} · ${count(s)} mẫu</span></span></a>`;
  return `
  <section class="container hero">
    <div class="hero-card">
      <div class="hero-text">
        <p class="eyebrow">Cây cảnh trong nhà & văn phòng</p>
        <h1>Một chậu cây đẹp, cả không gian dễ chịu</h1>
        <p>Hơn ${PRODUCTS.length} mẫu cây được thuần tại vườn, giao tận nơi trong ngày, kèm hướng dẫn chăm sóc và bảo hành 14 ngày.</p>
        <div class="hero-btns"><a href="#san-pham" class="btn btn-primary">Xem tất cả cây</a><a href="#lien-he" class="btn btn-outline">Nhờ tư vấn chọn cây</a></div>
        <div class="hero-stats"><div><b>14 ngày</b><span>bảo hành cây</span></div><div><b>2–4 giờ</b><span>giao nội thành</span></div><div><b>Trọn đời</b><span>hỗ trợ chăm cây</span></div></div>
      </div>
      <div class="hero-visual">
        ${h.map((p, i) => `<a href="${prodHref(p)}" class="hv ${i === 0 ? "big" : ""}">${photo(p.art, ["#dfe9da", "#ece6d9", "#e3ebe6"][i])}<span class="hv-tag"><b>${p.name}</b><span>${fmt(p.price)}</span></span></a>`).join("")}
      </div>
    </div>
  </section>

  <section class="section tight">
    <div class="container">
      <div class="sec-head"><div><p class="eyebrow">Danh mục</p><h2 class="h2">Bạn đang tìm cây gì?</h2></div><a href="#san-pham" class="link-arrow">Tất cả danh mục</a></div>
      <div class="cat-row">${chips.map((s) => `<a href="${catHref(s)}" class="cat-chip"><span class="ring">${photo(firstOf(s).art)}</span>${catName(s).replace("Cây Cảnh ", "Cây ")}<small>${count(s)} mẫu</small></a>`).join("")}</div>
    </div>
  </section>

  <section class="section tight">
    <div class="container">
      <div class="sec-head"><div><p class="eyebrow">Được chọn nhiều nhất</p><h2 class="h2">Cây bán chạy</h2></div>
        <div class="pills" role="tablist">${HOME_TABS.map(([k, t]) => `<button class="pill ${k === homeFilter ? "on" : ""}" data-home="${k}">${t}</button>`).join("")}</div></div>
      <div id="homeGrid">${grid(homeHot())}</div>
    </div>
  </section>

  <section class="section tight">
    <div class="container">
      <div class="sec-head"><div><p class="eyebrow">Mua theo không gian</p><h2 class="h2">Đặt cây ở đâu cũng đẹp</h2></div></div>
      <div class="rooms">
        ${room("loai-to", "Phòng khách", "Cây lớn tạo điểm nhấn", A("tree", "#dfe9da", "#ffffff", "#2e6e2a", "#4b8f3b"))}
        ${room("van-phong", "Văn phòng", "Hợp điều hòa, dễ chăm", A("tall", "#e6e2d6", "#2f2f2f", "#3e6e2f", "#c9c24a"))}
        ${room("de-ban", "Bàn làm việc", "Nhỏ gọn, xinh xắn", A("rosette", "#e3ebe6", "", "#7fae6a", "#b4d39a", "#e08aa0"))}
      </div>
    </div>
  </section>

  <section class="section tight">
    <div class="container">
      <div class="sec-head"><div><p class="eyebrow">Vừa cập bến</p><h2 class="h2">Cây mới về</h2></div><a href="#san-pham" class="link-arrow">Xem thêm</a></div>
      ${grid(PRODUCTS.slice(0, 4))}
    </div>
  </section>

  <section class="section tight">
    <div class="container">
      <div class="consult">
        <div><p class="eyebrow" style="color:#e9b79f">Tư vấn miễn phí</p><h2 class="h2">Chưa biết chọn cây nào cho không gian của bạn?</h2>
          <p>Gửi ảnh góc phòng qua Zalo, chúng tôi gợi ý loại cây hợp ánh sáng, diện tích và phong thủy trong 15 phút.</p></div>
        <div class="consult-actions"><span>Gọi hoặc nhắn Zalo</span><span class="phone">${SHOP.hotline}</span><a href="#lien-he" class="btn btn-light">Gửi yêu cầu tư vấn</a></div>
      </div>
    </div>
  </section>

  <section class="section tight">
    <div class="container">
      <div class="sec-head"><div><p class="eyebrow">Khách hàng nói gì</p><h2 class="h2">Đánh giá từ khách hàng</h2></div></div>
      <div class="reviews">${REVIEWS.slice(0, 3).map((r) => `<div class="review"><span class="stars">★★★★★</span><blockquote>“${r.q}”</blockquote>
        <cite><span class="avatar">${r.name.split(" ")[2] || "K"}</span><span>${r.name}<br><span class="note">Nội dung mẫu – thay bằng đánh giá thật</span></span></cite></div>`).join("")}</div>
    </div>
  </section>

  <section class="section tight" style="padding-bottom:64px">
    <div class="container">
      <div class="sec-head"><div><p class="eyebrow">Cẩm nang</p><h2 class="h2">Mẹo chăm cây</h2></div><a href="#tin-tuc" class="link-arrow">Tất cả bài viết</a></div>
      <div class="posts">${POSTS.slice(0, 3).map((x, i) => postCard(x, `#bai-viet-${i}`)).join("")}</div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------
// TRANG DANH MỤC / TẤT CẢ SẢN PHẨM (có bộ lọc)
// ---------------------------------------------------------------------
const PRICES = [["p1", "Dưới 200.000₫", 0, 200000], ["p2", "200.000₫ – 500.000₫", 200000, 500000], ["p3", "500.000₫ – 1.000.000₫", 500000, 1000000], ["p4", "Trên 1.000.000₫", 1000000, 1e12]];
const LIGHTS = [["bong", "Chịu bóng, ít sáng"], ["sang", "Trong nhà có ánh sáng"], ["nang", "Ban công, có nắng"]];
const lightOf = (p) => (/bóng/.test(p.light) ? "bong" : /nắng/.test(p.light) ? "nang" : p.light ? "sang" : "");
let shop = { cat: "", price: new Set(), light: new Set(), sort: "hot" };

function shopList() {
  const sorters = { hot: (a, b) => isHot(b) - isHot(a) || a.id - b.id, new: (a, b) => a.id - b.id, asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price };
  return PRODUCTS.filter((p) => (!shop.cat || p.cats.includes(shop.cat))
    && (!shop.price.size || PRICES.some(([k, , lo, hi]) => shop.price.has(k) && p.price >= lo && p.price < hi))
    && (!shop.light.size || shop.light.has(lightOf(p)))).sort(sorters[shop.sort]);
}
function shopPage(cat) {
  shop = { cat, price: new Set(), light: new Set(), sort: "hot" };
  const c = cat ? CATEGORIES[cat] : { name: "Tất cả cây cảnh", intro: "Cây cảnh nội thất, văn phòng, phong thủy và phụ kiện – lọc theo giá và ánh sáng để tìm cây hợp với bạn." };
  const crumbs = cat ? [["Sản phẩm", "#san-pham"]] : [];
  return { title: c.name, desc: `${c.name} tại ${SHOP.name}: ${c.intro}`, html: head(c.name, crumbs, c.intro) + `
  <div class="container shop">
    <aside class="filters" id="filters">
      <div class="f-group"><h5>Danh mục</h5><div class="f-cats">
        <a href="#san-pham" class="${cat ? "" : "on"}">Tất cả <em>${PRODUCTS.length}</em></a>
        ${TYPE_CATS.concat(BEST_CATS.filter((s) => !TYPE_CATS.includes(s))).map((s) => `<a href="${catHref(s)}" class="${s === cat ? "on" : ""}">${catName(s)} <em>${count(s)}</em></a>`).join("")}</div></div>
      <div class="f-group"><h5>Khoảng giá</h5>${PRICES.map(([k, t]) => `<label class="f-opt"><input type="checkbox" data-fprice="${k}"> ${t}</label>`).join("")}</div>
      <div class="f-group"><h5>Nơi đặt cây</h5>${LIGHTS.map(([k, t]) => `<label class="f-opt"><input type="checkbox" data-flight="${k}"> ${t}</label>`).join("")}</div>
    </aside>
    <div>
      <div class="shop-bar"><span id="shopCount"></span>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-outline filter-toggle" id="filterToggle" style="padding:8px 16px">Bộ lọc</button>
        <select id="shopSort" aria-label="Sắp xếp"><option value="hot">Bán chạy</option><option value="new">Mới nhất</option><option value="asc">Giá thấp → cao</option><option value="desc">Giá cao → thấp</option></select></div></div>
      <div id="shopGrid"></div>
    </div>
  </div>`, after: refreshShop };
}
function refreshShop() {
  const list = shopList();
  $("shopCount").innerHTML = `<b>${list.length}</b> sản phẩm`;
  $("shopGrid").innerHTML = list.length ? grid(list, "cols3") : `<div class="empty"><b>Không có cây phù hợp</b>Thử bỏ bớt bộ lọc nhé.</div>`;
}

// ---------------------------------------------------------------------
// TRANG SẢN PHẨM
// ---------------------------------------------------------------------
function productPage(p) {
  const cat = p.cats[0], plant = cat !== "phu-kien";
  const views = p.art.img ? [PHOTO] : [PHOTO, "#e6eee2", "#efe8dc"];
  const related = PRODUCTS.filter((x) => x.id !== p.id && x.cats.some((k) => p.cats.includes(k))).slice(0, 4);
  return { title: p.name, desc: `${p.name} giá ${fmt(p.price)}. ${p.short}`, product: p, html: `
  <div class="container page-head"><nav class="crumbs"><a href="#trang-chu">Trang chủ</a><span>/</span><a href="#san-pham">Sản phẩm</a><span>/</span><a href="${catHref(cat)}">${catName(cat)}</a><span>/</span><span>${p.name}</span></nav></div>
  <div class="container pd">
    <div class="gallery">
      <div class="thumbs">${views.map((bg, k) => `<button class="${k ? "" : "on"}" data-thumb="${k}" aria-label="Ảnh ${k + 1}">${photo(p.art, bg)}</button>`).join("")}</div>
      <div class="main-img" id="mainImg">${photo(p.art)}</div>
    </div>
    <div>
      <a href="${catHref(cat)}" class="pd-cat">${catName(cat)}</a>
      <h1>${p.name}</h1>
      <div class="pd-sub"><span class="in-stock">● Còn hàng</span><span>Mã SP: ${p.msp}</span>${isHot(p) ? "<span>🔥 Bán chạy</span>" : ""}</div>
      <div class="pd-price">${fmt(p.price)}</div>
      ${plant ? `<p class="pd-note">Giá chưa gồm chậu sứ hoặc bình thủy tinh</p>` : ""}
      <p class="pd-desc">${p.short}</p>
      <div class="specs">
        <div class="spec"><small>Kích thước</small><b>${p.size}</b></div>
        ${plant ? `<div class="spec"><small>Ánh sáng</small><b>${p.light}</b></div><div class="spec"><small>Độ khó</small><b>Dễ chăm</b></div>` : `<div class="spec"><small>Tình trạng</small><b>Mới 100%</b></div>`}
      </div>
      <div class="buy-row">
        <div class="stepper"><button data-step="-1" aria-label="Giảm">−</button><input id="pdQty" type="number" min="1" max="99" value="1" aria-label="Số lượng"><button data-step="1" aria-label="Tăng">+</button></div>
        <button class="btn btn-primary" data-buy="${p.id}" data-mode="add">Thêm vào giỏ</button>
        <button class="btn btn-outline" data-buy="${p.id}" data-mode="now">Mua ngay</button>
      </div>
      <ul class="assure">
        <li>Giao trong 2–4 giờ nội thành, đóng gói chống dập</li>
        <li>Bảo hành 14 ngày – cây hỏng đổi cây mới</li>
        <li>Xem ảnh cây thật qua Zalo ${SHOP.hotline} trước khi giao</li>
      </ul>
    </div>
  </div>
  <div class="container">
    <div class="tabs" role="tablist"><button class="on" data-tab="0">Mô tả</button><button data-tab="1">Cách chăm sóc</button><button data-tab="2">Câu hỏi thường gặp</button></div>
    <div class="tab-panel prose" data-panel="0">
      <h2>Đặc điểm nổi bật</h2><p>${p.short}</p>
      ${plant ? `<h2>Ý nghĩa</h2><p>${p.name} mang ý nghĩa may mắn, bình an và sinh sôi. Cây hợp đặt phòng khách, bàn làm việc hoặc làm quà khai trương, tân gia.</p>
      <h2>Điều kiện sinh trưởng</h2><p>Ưa ${p.light}, nhiệt độ 18–32°C, đất tơi xốp thoát nước tốt.</p>` : ""}
      <h2>Giá bán</h2><p>${p.name} có giá <b>${fmt(p.price)}</b>. Mua số lượng lớn hoặc cho công trình, vui lòng gọi ${SHOP.hotline} để có giá tốt hơn.</p>
    </div>
    <div class="tab-panel prose" data-panel="1" hidden>
      ${plant ? `<ul class="check"><li><b>Tưới nước:</b> khi mặt đất khô 2–3cm, thường 1–2 lần/tuần.</li><li><b>Ánh sáng:</b> ${p.light}.</li><li><b>Bón phân:</b> phân tan chậm 1–2 tháng một lần.</li><li><b>Cắt tỉa:</b> bỏ lá vàng, cành yếu để cây thông thoáng.</li></ul>
      <p>Xem thêm hướng dẫn chi tiết tại <a href="#cham-soc">Cách chăm sóc cây cảnh</a>.</p>` : `<p>Vệ sinh bằng khăn ẩm, tránh va đập mạnh.</p>`}
    </div>
    <div class="tab-panel" data-panel="2" hidden>${faq(plant ? [
      [`${p.name} có để trong nhà được không?`, `Được, nếu đặt nơi có ${p.light}.`],
      ["Vì sao lá bị vàng?", "Thường do tưới quá nhiều hoặc thiếu sáng. Giảm tưới và mang cây ra chỗ sáng hơn."],
      ["Cây có độc không?", "Không gây hại khi tiếp xúc thông thường. Không nên để trẻ nhỏ, thú cưng nhai lá."],
      ["Mua về có được bảo hành không?", "Có, bảo hành 14 ngày theo chính sách bảo hành."]] : [
      ["Có được đổi trả không?", "Có, trong 3 ngày nếu lỗi do vận chuyển."], ["Có giao tận nơi không?", "Có, giao nội thành trong ngày."]])}</div>
  </div>
  ${moreProducts("Sản phẩm tương tự", related)}` };
}

// ---------------------------------------------------------------------
// CÁC TRANG NỘI DUNG
// ---------------------------------------------------------------------
const withSide = (inner) => `<div class="container content-wrap"><div class="prose">${inner}</div>${sideCard()}</div>`;
const PAGES = {
  "trang-chu": () => ({ title: "", html: homePage() }),
  "san-pham": () => shopPage(""),

  "gioi-thieu": () => ({ title: "Giới thiệu", html: head("Giới thiệu", [], `${SHOP.name} – mang không gian xanh đến mọi nhà.`) + withSide(`
    <div class="lead-img">${photo(A("tree", "#e3ebdd", "#ffffff", "#2e6e2a", "#4b8f3b"), "#e3ebdd")}</div>
    <p>${SHOP.name} ra đời với mong muốn mang cây xanh vào từng căn nhà, văn phòng, đồng thời chia sẻ kinh nghiệm chăm sóc để cây sống khỏe lâu dài. Mua cây ở đây, bạn còn được hướng dẫn cách chăm và cách xử lý khi cây gặp vấn đề.</p>
    <p>Cây được bảo hành từ 7 đến 30 ngày tùy kích thước. Kể cả khi bạn mua cây ở nơi khác, chúng tôi vẫn sẵn sàng tư vấn miễn phí.</p>
    <h2>Vì sao chọn ${SHOP.name}?</h2>
    <ul class="check"><li>Có vườn ươm riêng, cây được thuần trước khi giao.</li><li>Bảo hành sau khi mua, đổi cây nếu hỏng.</li><li>Tư vấn chọn cây theo ánh sáng, diện tích và phong thủy.</li><li>Hỗ trợ chăm sóc trọn đời qua Zalo.</li></ul>
    <h2>Chúng tôi làm những gì?</h2>
    <div class="tiles">
      <a href="#san-pham" class="tile"><span class="mini-img">${photo(PRODUCTS[12].art)}</span><span><b>Bán cây cảnh</b><span>Nội thất, văn phòng, phong thủy</span></span></a>
      <a href="#dich-vu-cham-soc" class="tile"><span class="mini-img">${photo(PRODUCTS[19].art)}</span><span><b>Chăm sóc định kỳ</b><span>Cho văn phòng, tòa nhà</span></span></a>
      <a href="#du-an" class="tile"><span class="mini-img">${photo(PROJECTS[0].art)}</span><span><b>Thiết kế, thi công</b><span>Tiểu cảnh, sân vườn, vườn đứng</span></span></a>
      <a href="#danh-muc-cong-trinh" class="tile"><span class="mini-img">${photo(PRODUCTS[5].art)}</span><span><b>Cây công trình</b><span>Số lượng lớn cho dự án</span></span></a>
    </div>`) }),

  "tin-tuc": () => ({ title: "Tin tức", html: head("Tin tức & mẹo chăm cây", [], "Kinh nghiệm chọn cây, chăm cây và bài viết phong thủy.") +
    `<div class="container" style="padding-block:20px 56px"><div class="posts">${POSTS.map((x, i) => postCard(x, `#bai-viet-${i}`)).join("")}</div></div>` }),

  "du-an": () => ({ title: "Dự án", html: head("Công trình đã thi công", [], "Một số dự án cây xanh cho biệt thự, căn hộ, văn phòng và nhà hàng.") +
    `<div class="container" style="padding-block:20px 56px"><div class="posts">${PROJECTS.map((x, i) => postCard({ ...x, d: "" }, `#du-an-${i}`)).join("")}</div></div>` }),

  "cham-soc": () => ({ title: "Cách chăm sóc cây cảnh", html: head("Cách chăm sóc cây cảnh", [], "Chọn nhóm cây bạn đang trồng để xem hướng dẫn chi tiết.") + withSide(`
    <div class="tiles">${Object.entries(CARE).map(([k, c]) => `<a href="#${k}" class="tile"><span class="mini-img">${photo(c.art)}</span><span><b>${c.name.replace("Cách chăm sóc ", "Chăm ")}</b><span>${c.s.length} bước cơ bản</span></span></a>`).join("")}
      <a href="#dich-vu-cham-soc" class="tile"><span class="mini-img">${photo(PRODUCTS[21].art)}</span><span><b>Thuê chăm sóc định kỳ</b><span>Không có thời gian? Để chúng tôi lo</span></span></a></div>
    <h2>3 nguyên tắc chung</h2>
    <ul class="check"><li><b>Tưới khi đất khô</b>, không tưới theo thói quen mỗi ngày.</li><li><b>Đủ ánh sáng</b>: phần lớn cây trong nhà cần ánh sáng tán xạ.</li><li><b>Chậu thoát nước tốt</b> để rễ không bị úng.</li></ul>`) }),

  "dich-vu-cham-soc": () => ({ title: "Dịch vụ chăm sóc cây", html: head("Dịch vụ chăm sóc cây cảnh", [["Sản phẩm", "#san-pham"]], "Chăm cây định kỳ cho văn phòng, tòa nhà – có gói thay cây miễn phí.") + withSide(`
    <h2>Bạn nhận được gì?</h2><ul class="check">${SERVICE.benefits.map((b) => `<li>${b}</li>`).join("")}</ul>
    <h2>Bảng giá tham khảo</h2>
    <div class="table-wrap"><table class="table"><thead><tr><th>Số lượng cây</th><th>Số lần chăm</th><th>Giá / tháng</th></tr></thead>
      <tbody>${SERVICE.table.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}</b></td></tr>`).join("")}</tbody></table></div>
    <p class="hint">Giá tham khảo – sửa trong file data.js.</p>
    <h2>Câu hỏi thường gặp</h2>${faq(SERVICE.faq)}
    <div class="note-box">Cần báo giá chính xác? Gọi <b>${SHOP.hotline}</b> hoặc <a href="#lien-he">gửi yêu cầu</a>.</div>`) }),

  "ban-do": () => ({ title: "Bản đồ", html: head("Bản đồ cửa hàng", [], "Ghé xem cây trực tiếp tại cửa hàng.") + `
    <div class="container two-col">
      <div class="map">
        <svg viewBox="0 0 600 420" aria-hidden="true"><rect width="600" height="420" fill="#eef1e8"/>
          <path d="M0 300 C120 270 220 330 340 290 S520 230 600 250" stroke="#bcd6e4" stroke-width="30" fill="none"/>
          <path d="M0 110 H600 M0 210 H600 M180 0 V420 M420 0 V420" stroke="#fff" stroke-width="12"/>
          <path d="M60 0 L260 420 M520 0 L360 420" stroke="#fff" stroke-width="6"/>
          <rect x="30" y="30" width="120" height="55" rx="8" fill="#dfe8d6"/><rect x="450" y="130" width="120" height="55" rx="8" fill="#dfe8d6"/><rect x="210" y="130" width="180" height="55" rx="8" fill="#d4e3c9"/>
          <g transform="translate(300 170)"><circle r="40" fill="#2f6b45" opacity=".15"/><path d="M0 0c-16-22-24-34-24-46a24 24 0 0 1 48 0c0 12-8 24-24 46z" fill="#2f6b45"/><circle cy="-46" r="9" fill="#fff"/></g></svg>
        <div class="map-card"><b>${SHOP.name}</b>${SHOP.address}</div>
      </div>
      <div class="panel"><ul class="info-list">
        <li><i>📍</i><span><small>Địa chỉ</small>${SHOP.address}</span></li>
        <li><i>📞</i><span><small>Hotline</small>${SHOP.hotline}</span></li>
        <li><i>🕗</i><span><small>Giờ mở cửa</small>${SHOP.hours}</span></li></ul>
        <a class="btn btn-primary" style="margin-top:22px;width:100%" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SHOP.address)}" target="_blank" rel="noopener">Chỉ đường bằng Google Maps</a>
        <p class="hint" style="margin-top:12px">Khi đưa lên VPS có thể thay khung bên trái bằng bản đồ Google Maps thật.</p></div>
    </div>${moreProducts("Cây được quan tâm")}` }),

  "lien-he": () => ({ title: "Liên hệ", html: head("Liên hệ", [], "Hỏi gì về cây cũng được – chọn cây, chăm cây, báo giá số lượng lớn.") + `
    <div class="container two-col">
      <div class="panel"><ul class="info-list">
        <li><i>📞</i><span><small>Hotline / Zalo</small><b>${SHOP.hotline}</b></span></li>
        <li><i>✉</i><span><small>Email</small>${SHOP.email}</span></li>
        <li><i>📍</i><span><small>Cửa hàng</small>${SHOP.address}</span></li>
        <li><i>🕗</i><span><small>Giờ mở cửa</small>${SHOP.hours}</span></li></ul>
        <h3 style="margin:24px 0 8px;font-size:16px">Chúng tôi thường được hỏi</h3>
        <ul class="check" style="display:grid;gap:6px;font-size:14px;color:#3a443d"><li>Bàn làm việc nên đặt cây gì?</li><li>Cây nào hợp tuổi, hợp mệnh?</li><li>Cây vàng lá, nhũn lá thì xử lý sao?</li><li>Mua số lượng nhiều có ưu đãi không?</li></ul></div>
      <form class="panel form" id="contactForm" novalidate>
        <h3 style="font-size:20px">Gửi lời nhắn</h3>
        <div class="row2"><label>Họ và tên *<input id="cName"></label><label>Số điện thoại *<input id="cPhone" type="tel" placeholder="0912 345 678"></label></div>
        <label>Email<input id="cEmail" type="email"></label>
        <label>Bạn cần tư vấn gì? *<textarea id="cMsg" rows="5" placeholder="Ví dụ: phòng khách 20m², ít nắng, muốn cây cao khoảng 1m"></textarea></label>
        <button class="btn btn-primary" type="submit">Gửi lời nhắn</button>
        <p class="err-msg" id="cResult" role="status"></p>
      </form>
    </div>` }),

  "mua-hang": () => {
    const list = items();
    if (!list.length) return { title: "Giỏ hàng", html: head("Giỏ hàng") + `<div class="container"><div class="empty"><b>Giỏ hàng đang trống</b>Hãy chọn vài chậu cây bạn thích nhé.<br><br><a href="#san-pham" class="btn btn-primary">Xem cây</a></div></div>${moreProducts("Gợi ý cho bạn")}` };
    const t = total();
    return { title: "Giỏ hàng", html: head("Giỏ hàng", [], `${qtyAll()} sản phẩm`) + `
    <div class="container cart-wrap">
      <div class="cart-list">${list.map(({ p, q }) => `<div class="cart-item">
        <a href="${prodHref(p)}" class="mini-img">${photo(p.art)}</a>
        <div><a href="${prodHref(p)}"><b>${p.name}</b></a><span class="unit">${fmt(p.price)} · ${p.size}</span></div>
        <div class="right"><span class="line-total">${fmt(p.price * q)}</span>
          <div class="stepper sm"><button data-cart="-1" data-id="${p.id}" aria-label="Giảm">−</button><span>${q}</span><button data-cart="1" data-id="${p.id}" aria-label="Tăng">+</button></div>
          <button class="remove" data-cart="rm" data-id="${p.id}">Xóa</button></div></div>`).join("")}</div>
      <div class="summary"><h3>Tóm tắt đơn hàng</h3>
        <div class="sum-row"><span>Tạm tính</span><span>${fmt(t)}</span></div>
        <div class="sum-row"><span>Giao hàng</span><span>${t >= 500000 ? "Miễn phí" : "Tính khi xác nhận"}</span></div>
        <div class="sum-row total"><span>Tổng cộng</span><span>${fmt(t)}</span></div>
        ${t < 500000 ? `<p class="free-ship">Mua thêm ${fmt(500000 - t)} để được miễn phí giao hàng</p>` : ""}
        <a href="#thanh-toan" class="btn btn-primary">Tiến hành đặt hàng</a>
        <a href="#san-pham" class="btn btn-outline" style="margin-top:10px">Tiếp tục mua cây</a></div>
    </div>` };
  },

  "thanh-toan": () => {
    const list = items();
    if (!list.length) return PAGES["mua-hang"]();
    return { title: "Đặt hàng", html: head("Đặt hàng", [["Giỏ hàng", "#mua-hang"]]) + `
    <div class="container cart-wrap">
      <form class="panel form" id="orderForm" novalidate>
        <h3 style="font-size:20px">Thông tin nhận hàng</h3>
        <div class="row2"><label>Họ và tên *<input id="oName"></label><label>Số điện thoại *<input id="oPhone" type="tel"></label></div>
        <label>Địa chỉ nhận hàng *<input id="oAddr" placeholder="Số nhà, đường, phường, quận"></label>
        <label>Ghi chú<textarea id="oNote" rows="3" placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao"></textarea></label>
        <h3 style="font-size:16px;margin-top:6px">Hình thức thanh toán</h3>
        <label class="radio-card"><input type="radio" name="pay" value="COD" checked> Thanh toán khi nhận hàng (COD)</label>
        <label class="radio-card"><input type="radio" name="pay" value="Chuyển khoản"> Chuyển khoản sau khi cửa hàng xác nhận</label>
        <button class="btn btn-primary" type="submit">Đặt hàng · ${fmt(total())}</button>
        <p class="err-msg" id="oResult" role="status"></p>
      </form>
      <div class="summary"><h3>Đơn hàng (${qtyAll()})</h3>
        ${list.map(({ p, q }) => `<div class="sum-row"><span>${p.name} × ${q}</span><span>${fmt(p.price * q)}</span></div>`).join("")}
        <div class="sum-row"><span>Giao hàng</span><span>${total() >= 500000 ? "Miễn phí" : "Tính khi xác nhận"}</span></div>
        <div class="sum-row total"><span>Tổng cộng</span><span>${fmt(total())}</span></div></div>
    </div>` };
  },

  "tim-kiem": () => {
    const q = searchQuery.toLowerCase(), found = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
    return { title: "Tìm kiếm", html: head(`Kết quả cho “${esc(searchQuery)}”`, [], `${found.length} sản phẩm`) +
      `<div class="container" style="padding-block:20px 56px">${found.length ? grid(found) : `<div class="empty"><b>Không tìm thấy cây phù hợp</b>Thử từ khóa khác như "kim", "trúc", "sen đá".</div>`}</div>` };
  },

  "so-do-trang": () => ({ title: "Sơ đồ trang", html: head("Sơ đồ trang") + `<div class="container sitemap">
    <div><h3>Trang chính</h3><a href="#trang-chu">Trang chủ</a><a href="#san-pham">Tất cả sản phẩm</a><a href="#gioi-thieu">Giới thiệu</a><a href="#tin-tuc">Tin tức</a><a href="#du-an">Dự án</a><a href="#ban-do">Bản đồ</a><a href="#lien-he">Liên hệ</a><a href="#mua-hang">Giỏ hàng</a></div>
    <div><h3>Danh mục</h3>${Object.keys(CATEGORIES).map((s) => `<a href="${catHref(s)}">${catName(s)}</a>`).join("")}</div>
    <div><h3>Chăm sóc</h3><a href="#cham-soc">Tổng quan</a>${Object.entries(CARE).map(([k, c]) => `<a href="#${k}">${c.name}</a>`).join("")}<a href="#dich-vu-cham-soc">Dịch vụ chăm sóc</a>
      <h3 style="margin-top:20px">Chính sách</h3>${Object.entries(POLICIES).map(([k, v]) => `<a href="#${k}">${v.name}</a>`).join("")}</div></div>` }),
};

Object.entries(CARE).forEach(([k, c]) => (PAGES[k] = () => ({ title: c.name, html: head(c.name, [["Cách chăm sóc", "#cham-soc"]]) + withSide(`
  <div class="lead-img">${photo(c.art, "#e6eee2")}</div><p>${c.intro}</p>
  <div class="toc"><b>Nội dung</b><ol>${c.s.map(([h]) => `<li>${h}</li>`).join("")}</ol></div>${sections(c.s)}`) + moreProducts("Cây dễ chăm cho người mới") })));

Object.entries(POLICIES).forEach(([k, v]) => (PAGES[k] = () => ({ title: v.name, html: head(v.name, [["Chính sách", "#chinh-sach-chung"]]) + `
  <div class="container policy-wrap"><nav class="policy-menu">${Object.entries(POLICIES).map(([kk, vv]) => `<a href="#${kk}" class="${kk === k ? "on" : ""}">${vv.name}</a>`).join("")}</nav>
  <div class="prose">${v.s.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join("")}</div></div>` })));

function dynamicPage(route) {
  let m;
  if ((m = route.match(/^danh-muc-(.+)$/)) && CATEGORIES[m[1]]) return shopPage(m[1]);
  if ((m = route.match(/^san-pham-(\d+)$/)) && PRODUCTS[m[1]]) return productPage(PRODUCTS[m[1]]);
  if ((m = route.match(/^bai-viet-(\d+)$/)) && POSTS[m[1]]) {
    const i = +m[1], x = POSTS[i];
    return { title: x.t, desc: x.p, html: head(x.t, [["Tin tức", "#tin-tuc"]]) + withSide(`
      <p class="meta">${x.d} · ${SHOP.name}</p><div class="lead-img">${photo(x.art, x.art.bg)}</div>
      <p><b>${x.p}</b></p><div class="toc"><b>Nội dung bài viết</b><ol>${x.s.map(([h]) => `<li>${h}</li>`).join("")}</ol></div>${sections(x.s)}
      <div class="note-box">Cần tư vấn chọn cây? Gọi <b>${SHOP.hotline}</b> hoặc xem <a href="#danh-muc-trong-nha">cây cảnh trong nhà</a>.</div>`) +
      `<section class="section tight"><div class="container"><div class="sec-head"><h2 class="h2">Bài viết liên quan</h2></div><div class="posts">${POSTS.map((p, k) => [p, k]).filter(([, k]) => k !== i).slice(0, 3).map(([p, k]) => postCard(p, `#bai-viet-${k}`)).join("")}</div></div></section>` };
  }
  if ((m = route.match(/^du-an-(\d+)$/)) && PROJECTS[m[1]]) {
    const x = PROJECTS[+m[1]];
    return { title: x.t, desc: x.p, html: head(x.t, [["Dự án", "#du-an"]]) + withSide(`
      <div class="lead-img">${photo(x.art, x.art.bg)}</div><p>${x.p.replace("…", ".")}</p>
      <h2>Yêu cầu</h2><p>Tạo mảng xanh hài hòa với kiến trúc sẵn có, cây dễ chăm và bền trong điều kiện thực tế.</p>
      <h2>Giải pháp</h2><p>Khảo sát ánh sáng và diện tích, lên phương án bố trí, chọn chậu đồng bộ, bàn giao kèm hướng dẫn chăm sóc.</p>
      <h2>Cây sử dụng</h2><p>${x.plants}.</p><h2>Kết quả</h2><p>Không gian thoáng đãng hơn, khách hàng ký tiếp gói chăm sóc định kỳ.</p>
      <p class="hint">Nội dung mẫu – thay bằng ảnh và mô tả dự án thật.</p>`) };
  }
  return null;
}

// ---------------------------------------------------------------------
// CHUYỂN TRANG
// ---------------------------------------------------------------------
let searchQuery = "";
// Khi chạy trên hosting/VPS (bản đã "xây dựng"), dùng địa chỉ thật: /san-pham-3/ thay cho #san-pham-3
const PRETTY = document.documentElement.dataset.pretty === "1";
function prettyLinks(root) {
  root.querySelectorAll('a[href^="#"]').forEach((a) => {
    const r = a.getAttribute("href").slice(1);
    if (r) a.setAttribute("href", r === "trang-chu" ? "/" : `/${r}/`);
  });
}
function setMeta(page) {
  const desc = (page.desc || `${SHOP.name} – cây cảnh trong nhà, cây văn phòng, cây phong thủy. Giao nhanh, bảo hành 14 ngày, tư vấn chăm sóc trọn đời.`).replace(/<[^>]+>/g, "").slice(0, 160);
  let m = document.querySelector('meta[name="description"]');
  if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
  m.content = desc;
}
const navGroup = (r) => (r.startsWith("cham-soc") || r === "dich-vu-cham-soc" ? "cham-soc" : POLICIES[r] ? "chinh-sach"
  : r === "san-pham" || r.startsWith("san-pham-") || r.startsWith("danh-muc-") ? "san-pham" : r === "thanh-toan" ? "mua-hang" : r.startsWith("du-an") ? "du-an" : r.startsWith("bai-viet") ? "tin-tuc" : r);

function render() {
  const route = decodeURIComponent(location.hash.slice(1)) || (PRETTY ? decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g, "") : "") || "trang-chu";
  closeMenu();
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === navGroup(route)));
  const page = (PAGES[route] && PAGES[route]()) || dynamicPage(route) ||
    { title: "Không tìm thấy trang", html: head("Không tìm thấy trang") + `<div class="container"><div class="empty"><b>Trang này không tồn tại</b><a href="#trang-chu" class="link-arrow">Về trang chủ</a></div></div>` };
  $("app").innerHTML = page.html;
  if (page.after) page.after();
  setMeta(page);
  if (PRETTY) prettyLinks(document);
  document.title = page.title ? `${page.title} – ${SHOP.name}` : `${SHOP.name} – Cây cảnh trong nhà & văn phòng`;
  scrollTo({ top: 0 });
}
addEventListener("hashchange", render);
render();

// ---------------------------------------------------------------------
// SỰ KIỆN
// ---------------------------------------------------------------------
document.addEventListener("click", (e) => {
  const t = e.target, q = (sel) => t.closest(sel);
  let el;
  if ((el = q("[data-add]"))) { e.preventDefault(); return addToCart(+el.dataset.add); }
  if ((el = q("[data-home]"))) {
    homeFilter = el.dataset.home;
    document.querySelectorAll("[data-home]").forEach((b) => b.classList.toggle("on", b === el));
    return ($("homeGrid").innerHTML = grid(homeHot()));
  }
  if ((el = q("[data-step]"))) { const i = $("pdQty"); i.value = Math.min(99, Math.max(1, (+i.value || 1) + +el.dataset.step)); return; }
  if ((el = q("[data-buy]"))) { addToCart(+el.dataset.buy, Math.max(1, +$("pdQty").value || 1)); if (el.dataset.mode === "now") location.hash = "mua-hang"; return; }
  if ((el = q("[data-thumb]"))) { $("mainImg").innerHTML = el.innerHTML; document.querySelectorAll("[data-thumb]").forEach((b) => b.classList.toggle("on", b === el)); return; }
  if ((el = q("[data-tab]"))) {
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b === el));
    document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== el.dataset.tab));
    return;
  }
  if ((el = q("[data-cart]"))) {
    const id = el.dataset.id, a = el.dataset.cart;
    if (a === "rm") delete cart[id]; else { cart[id] += +a; if (cart[id] <= 0) delete cart[id]; }
    saveCart(); updateCart(); return render();
  }
  if (q("#filterToggle")) return $("filters").classList.toggle("open");
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.fprice) { t.checked ? shop.price.add(t.dataset.fprice) : shop.price.delete(t.dataset.fprice); refreshShop(); }
  if (t.dataset.flight) { t.checked ? shop.light.add(t.dataset.flight) : shop.light.delete(t.dataset.flight); refreshShop(); }
  if (t.id === "shopSort") { shop.sort = t.value; refreshShop(); }
});

const isPhone = (v) => /^(0|\+84)[0-9 .]{8,12}$/.test(v.trim());
// Gửi dữ liệu khách về máy chủ (chương trình may-chu/nhan-du-lieu.py trên VPS)
const sendData = (url, data) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
  .then((r) => r.json().catch(() => ({})).then((j) => { if (!r.ok || !j.ok) throw new Error(j.loi || "loi"); return j; }));
const failText = () => `Chưa gửi được, vui lòng thử lại hoặc gọi ${SHOP.hotline}.`;
const busy = (f, on) => { const b = f.querySelector("button[type=submit]"); if (b) { b.disabled = on; b.style.opacity = on ? 0.6 : ""; } };
document.addEventListener("submit", (e) => {
  const f = e.target;
  if (f.id === "contactForm") {
    e.preventDefault();
    const m = $("cResult");
    if (!$("cName").value.trim() || !isPhone($("cPhone").value) || !$("cMsg").value.trim()) {
      m.className = "err-msg"; m.textContent = "Vui lòng nhập họ tên, số điện thoại (ví dụ 0912345678) và nội dung cần tư vấn."; return;
    }
    busy(f, true); m.className = "ok-msg"; m.textContent = "Đang gửi…";
    sendData("/api/lien-he", { name: $("cName").value, phone: $("cPhone").value, email: $("cEmail").value, msg: $("cMsg").value })
      .then(() => { m.className = "ok-msg"; m.textContent = "Đã nhận lời nhắn! Cửa hàng sẽ gọi lại cho bạn sớm."; f.reset(); })
      .catch(() => { m.className = "err-msg"; m.textContent = failText(); })
      .finally(() => busy(f, false));
  }
  if (f.id === "orderForm") {
    e.preventDefault();
    const m = $("oResult");
    if (!$("oName").value.trim() || !isPhone($("oPhone").value) || !$("oAddr").value.trim()) {
      m.textContent = "Vui lòng nhập họ tên, số điện thoại hợp lệ và địa chỉ nhận hàng."; return;
    }
    const sum = total(), name = $("oName").value.trim();
    const pay = (f.querySelector("input[name=pay]:checked") || {}).value || "";
    busy(f, true); m.textContent = "";
    sendData("/api/dat-hang", { name, phone: $("oPhone").value, addr: $("oAddr").value, note: $("oNote").value, pay,
      items: items().map(({ p, q }) => ({ name: p.name, q, price: p.price * q })), total: sum })
      .then((j) => {
        cart = {}; saveCart(); updateCart();
        $("app").innerHTML = `<div class="container success"><div class="tick">✓</div><h1>Đặt hàng thành công</h1>
          <p>Cảm ơn <b>${esc(name)}</b>! Mã đơn của bạn là <b>${esc(j.ma_don || "")}</b>, tổng tiền <b>${fmt(sum)}</b>.</p>
          <p>Cửa hàng sẽ gọi lại xác nhận trong ít phút.</p><br>
          <a href="#trang-chu" class="btn btn-primary">Tiếp tục mua sắm</a></div>`;
        scrollTo({ top: 0 });
      })
      .catch(() => { m.textContent = failText(); busy(f, false); });
  }
});

$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  searchQuery = $("searchInput").value.trim();
  if (!searchQuery) return;
  if (location.hash === "#tim-kiem") render(); else location.hash = "tim-kiem";
});

$("newsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("newsEmail").value.trim(), m = $("newsMsg");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { m.textContent = "Email chưa đúng, ví dụ: ten@gmail.com"; m.classList.add("err"); return; }
  const f = e.target; busy(f, true); m.classList.remove("err"); m.textContent = "Đang gửi…";
  sendData("/api/dang-ky", { email: v })
    .then(() => { m.textContent = "Đã đăng ký! Cảm ơn bạn."; $("newsEmail").value = ""; })
    .catch(() => { m.classList.add("err"); m.textContent = failText(); })
    .finally(() => busy(f, false));
});

$("toTop").onclick = () => scrollTo({ top: 0 });
addEventListener("scroll", () => $("toTop").classList.toggle("show", scrollY > 600));
