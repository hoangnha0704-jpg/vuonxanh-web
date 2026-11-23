// =====================================================================
//  XÂY DỰNG BẢN ĐƯA LÊN MẠNG
//  Chạy:  node xay-dung.js
//  Kết quả: thư mục "web" (cạnh thư mục nguon) – mỗi trang là 1 file HTML có sẵn nội dung,
//  tiêu đề, mô tả cho Google, kèm sitemap.xml và robots.txt.
//  __DOMAIN__ sẽ được thay bằng tên miền thật khi chạy cai-dat.sh trên VPS.
// =====================================================================
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const SRC = __dirname;
const OUT = path.join(SRC, "..", "web");
const NOINDEX = ["mua-hang", "thanh-toan", "tim-kiem"];

const prettyHref = (html) => html
  .replace(/href="#trang-chu"/g, 'href="/"')
  .replace(/href="#([a-z0-9-]+)"/g, 'href="/$1/"');
const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of ["style.css", "art.js", "data.js", "script.js"]) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
  if (fs.existsSync(path.join(SRC, "anh"))) fs.cpSync(path.join(SRC, "anh"), path.join(OUT, "anh"), { recursive: true });
  fs.writeFileSync(path.join(OUT, "favicon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#2f6b45"/><path d="M20 31V17" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M20 21c-6 0-9-4-9-9 6 0 9 4 9 9zM20 18c0-5 3-8 9-8 0 5-3 8-9 8z" fill="#cfe5c4"/></svg>`);

  const template = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("file://" + path.join(SRC, "index.html"));
  await page.waitForTimeout(500);

  const routes = await page.evaluate(() => [
    "trang-chu", ...Object.keys(PAGES).filter((r) => r !== "trang-chu"),
    ...Object.keys(CATEGORIES).map((s) => "danh-muc-" + s),
    ...PRODUCTS.map((p) => "san-pham-" + p.id),
    ...POSTS.map((_, i) => "bai-viet-" + i),
    ...PROJECTS.map((_, i) => "du-an-" + i),
  ]);
  const shop = await page.evaluate(() => SHOP);

  const sitemap = [];
  for (const r of routes) {
    await page.evaluate((h) => { location.hash = h; }, r);
    await page.waitForTimeout(20);
    const info = await page.evaluate((r) => {
      const p = (PAGES[r] && PAGES[r]()) || dynamicPage(r) || {};
      return {
        app: document.getElementById("app").innerHTML,
        title: document.title,
        desc: document.querySelector('meta[name="description"]').content,
        product: p.product ? { name: p.product.name, price: p.product.price, short: p.product.short, sku: p.product.msp } : null,
      };
    }, r);

    const url = r === "trang-chu" ? "https://__DOMAIN__/" : `https://__DOMAIN__/${r}/`;
    let ld = "";
    if (r === "trang-chu") ld = { "@context": "https://schema.org", "@type": "Store", name: shop.name, url, telephone: shop.hotline, address: shop.address, openingHours: "Mo-Su 08:00-20:00" };
    if (info.product) ld = { "@context": "https://schema.org", "@type": "Product", name: info.product.name, description: info.product.short, sku: String(info.product.sku),
      brand: { "@type": "Brand", name: shop.name }, offers: { "@type": "Offer", priceCurrency: "VND", price: info.product.price, availability: "https://schema.org/InStock", url } };

    const headTags = `
  <meta name="description" content="${escAttr(info.desc)}">
  <link rel="canonical" href="${url}">
  ${NOINDEX.includes(r) ? '<meta name="robots" content="noindex">' : ""}
  <meta property="og:type" content="${info.product ? "product" : "website"}">
  <meta property="og:title" content="${escAttr(info.title)}">
  <meta property="og:description" content="${escAttr(info.desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="${escAttr(shop.name)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  ${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : ""}`;

    let html = template
      .replace('<html lang="vi">', '<html lang="vi" data-pretty="1">')
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escAttr(info.title)}</title>${headTags}`)
      .replace('href="style.css"', 'href="/style.css"')
      .replace(/<script src="([a-z]+\.js)"><\/script>/g, '<script src="/$1"></script>')
      .replace('<main id="app"></main>', `<main id="app">${info.app}</main>`);
    html = prettyHref(html);

    const dir = r === "trang-chu" ? OUT : path.join(OUT, r);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    if (!NOINDEX.includes(r)) sitemap.push(url);
  }

  // Trang 404
  await page.evaluate(() => { location.hash = "khong-ton-tai"; });
  await page.waitForTimeout(20);
  const app404 = await page.evaluate(() => document.getElementById("app").innerHTML);
  fs.writeFileSync(path.join(OUT, "404.html"), prettyHref(template
    .replace('<html lang="vi">', '<html lang="vi" data-pretty="1">')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>Không tìm thấy trang – ${shop.name}</title><meta name="robots" content="noindex">`)
    .replace('href="style.css"', 'href="/style.css"')
    .replace(/<script src="([a-z]+\.js)"><\/script>/g, "")
    .replace('<main id="app"></main>', `<main id="app">${app404}</main>`)));

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
  fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *
Allow: /
Disallow: /mua-hang/
Disallow: /thanh-toan/
Sitemap: https://__DOMAIN__/sitemap.xml
`);

  await browser.close();
  console.log(`Đã tạo ${routes.length} trang, sitemap ${sitemap.length} địa chỉ. Lỗi: ${errors.length ? errors.join("; ") : "không có"}`);
})();
