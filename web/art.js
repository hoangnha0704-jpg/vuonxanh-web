// =====================================================================
//  VẼ ẢNH MINH HOẠ CÂY (kiểu "ảnh chụp studio": nền trơn, bóng đổ nhẹ)
//  Khi có ảnh thật, thay art(p.art) bằng <img src="anh/ten-cay.jpg">
// =====================================================================
let __artId = 0;
function art(a) {
  const id = "g" + (++__artId);
  const L1 = a.leaf || "#3f7d3a", L2 = a.leaf2 || "#5a9a4a";
  let plant = "";

  // Chậu có đổ bóng và ánh sáng nhẹ
  const pot = (c, top = 132, w = 76, h = 52) => {
    const x = 100 - w / 2;
    return `<ellipse cx="100" cy="${top + h + 2}" rx="${w / 2 + 8}" ry="6" fill="#000" opacity=".08"/>
      <path d="M${x + 4} ${top} H${x + w - 4} L${x + w - 10} ${top + h} H${x + 10} Z" fill="url(#${id}p)"/>
      <rect x="${x}" y="${top - 6}" width="${w}" height="10" rx="3" fill="url(#${id}p)"/>
      <path d="M${x + 12} ${top + 6} L${x + 16} ${top + h - 6}" stroke="#fff" stroke-width="4" opacity=".25" stroke-linecap="round"/>`;
  };
  const leafShape = (cx, cy, rx, ry, rot, fill, vein) =>
    `<g transform="rotate(${rot} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>
     <path d="M${cx} ${cy - ry + 3} V${cy + ry - 3}" stroke="${vein}" stroke-width="1.4" opacity=".55"/></g>`;

  if (["leafy", "flower", "striped"].includes(a.kind)) {
    const angles = [-70, -48, -26, -8, 10, 30, 52, 72, -36, 38, 0, -60, 62];
    angles.forEach((deg, i) => {
      const len = 46 + (i % 4) * 8, w = a.kind === "striped" ? 13 : 11;
      plant += `<g transform="rotate(${deg} 100 130)">
        <path d="M100 130 Q${100 + (i % 2 ? 3 : -3)} ${130 - len / 2} 100 ${130 - len + 10}" stroke="${L1}" stroke-width="2" fill="none"/>
        ${leafShape(100, 130 - len, w, len / 2.5, 0, i % 2 ? L1 : L2, a.kind === "striped" ? "#f4f7e8" : "#dfeccd")}
        ${a.kind === "striped" ? `<path d="M${100 - w + 4} ${130 - len} Q100 ${130 - len - 6} ${100 + w - 4} ${130 - len}" stroke="#eef5df" stroke-width="1.6" fill="none" opacity=".8"/>` : ""}
      </g>`;
    });
    if (a.kind === "flower") [[68, 64], [128, 58], [100, 42], [146, 92], [52, 96], [84, 52], [118, 78]].forEach(([x, y]) => {
      for (let k = 0; k < 5; k++) plant += `<ellipse cx="${x}" cy="${y - 5}" rx="3.6" ry="6" fill="${a.flower}" transform="rotate(${k * 72} ${x} ${y})" opacity=".95"/>`;
      plant += `<circle cx="${x}" cy="${y}" r="2.6" fill="#f3d36b"/>`;
    });
    plant += pot(a.pot || "#efebe3");
  }
  if (a.kind === "tall") {
    [[74, 58], [84, 30], [94, 16], [104, 22], [114, 36], [124, 26], [132, 60], [90, 48], [118, 52]].forEach(([x, t], i) => {
      const c = i % 2 ? L1 : "#2f5e2a";
      plant += `<path d="M${x - 6} 134 Q${x - 8} ${t + 40} ${x} ${t} Q${x + 8} ${t + 40} ${x + 6} 134Z" fill="${c}" stroke="${L2}" stroke-width="2.5"/>
        <path d="M${x - 2} 120 l4 -6 M${x - 2} 102 l4 -6 M${x - 2} 84 l4 -6" stroke="#9fbf7a" stroke-width="1.4" opacity=".7"/>`;
    });
    plant += pot(a.pot || "#efebe3");
  }
  if (a.kind === "fern") {
    for (let i = 0; i < 11; i++) {
      const ang = (-150 + i * 12) * Math.PI / 180, len = 70 + (i % 3) * 8;
      const ex = 100 + Math.cos(ang) * len, ey = 124 + Math.sin(ang) * len * 0.9;
      const cx = 100 + Math.cos(ang) * len * 0.5, cy = 124 + Math.sin(ang) * len - 18;
      plant += `<path d="M100 126 Q${cx} ${cy} ${ex} ${ey}" stroke="${L1}" stroke-width="1.8" fill="none"/>`;
      for (let k = 1; k < 9; k++) {
        const t = k / 9, px = (1 - t) ** 2 * 100 + 2 * (1 - t) * t * cx + t * t * ex, py = (1 - t) ** 2 * 126 + 2 * (1 - t) * t * cy + t * t * ey;
        const dx = 2 * (1 - t) * (cx - 100) + 2 * t * (ex - cx), dy = 2 * (1 - t) * (cy - 126) + 2 * t * (ey - cy);
        const rot = Math.atan2(dy, dx) * 180 / Math.PI, s = 7 - t * 4;
        plant += `<ellipse cx="${px}" cy="${py}" rx="${s}" ry="2.2" fill="${k % 2 ? L2 : L1}" transform="rotate(${rot + 60} ${px} ${py})"/>
                  <ellipse cx="${px}" cy="${py}" rx="${s}" ry="2.2" fill="${k % 2 ? L1 : L2}" transform="rotate(${rot - 60} ${px} ${py})"/>`;
      }
    }
    plant += pot(a.pot || "#efebe3");
  }
  if (a.kind === "tree") {
    plant += `<path d="M96 134 C94 112 90 98 98 74 L102 74 C108 98 106 112 104 134Z" fill="#7a5a3a"/>
      <path d="M100 96 C92 86 84 82 76 80 M101 88 C110 80 118 78 126 78" stroke="#7a5a3a" stroke-width="3" fill="none"/>`;
    [[76, 70, 24, L1], [124, 66, 26, L2], [100, 44, 28, L1], [100, 76, 20, L2], [84, 48, 18, L2], [118, 44, 18, L1], [64, 58, 14, L2], [138, 56, 14, L1]]
      .forEach(([x, y, r, c]) => { plant += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 3}" fill="#fff" opacity=".08"/>`; });
    plant += pot(a.pot || "#efebe3");
  }
  if (a.kind === "cactus") {
    plant += `<rect x="70" y="80" width="20" height="56" rx="10" fill="#5f8f4e"/><rect x="91" y="54" width="22" height="82" rx="11" fill="#4b7d3c"/>
      <rect x="114" y="88" width="18" height="48" rx="9" fill="#6d9a57"/><path d="M80 84v48M102 58v74M123 92v40" stroke="#a5c58f" stroke-width="1.5"/>
      <circle cx="102" cy="54" r="5" fill="#ef6f8c"/><circle cx="80" cy="80" r="4" fill="#f5c14a"/>` + pot(a.pot || "#efebe3");
  }
  if (a.kind === "ball") {
    plant += `<circle cx="86" cy="114" r="22" fill="#4e7d4a"/><circle cx="118" cy="110" r="25" fill="#5c8a52"/>
      <path d="M86 94v40M75 98l22 32M97 98l-22 32M118 86v48M105 90l26 40M131 90l-26 40" stroke="#8fb47f" stroke-width="1.2"/>
      <ellipse cx="86" cy="94" rx="8" ry="4" fill="#c0396a"/><ellipse cx="118" cy="86" rx="9" ry="4" fill="#c0396a"/>` + pot(a.pot || "#efebe3");
  }
  if (a.kind === "rosette") {
    plant += `<ellipse cx="100" cy="166" rx="56" ry="7" fill="#000" opacity=".07"/>`;
    [[60, 28, L1], [46, 22, L2], [32, 17, L1], [19, 11, L2]].forEach(([r, rx, c], ring) => {
      for (let i = 0; i < 10; i++) plant += `<g transform="rotate(${i * 36 + ring * 18} 100 112)"><ellipse cx="100" cy="${112 - r / 1.6}" rx="${rx / 2.2}" ry="${r / 1.7}" fill="${c}" stroke="${a.flower}" stroke-width="1.2"/></g>`;
    });
    plant += `<circle cx="100" cy="112" r="7" fill="${L2}"/>`;
  }
  if (a.kind === "terra") {
    plant += `<ellipse cx="100" cy="178" rx="56" ry="7" fill="#000" opacity=".08"/>
      <path d="M42 120 A58 58 0 0 0 158 120 Z" fill="#d8b98a"/><path d="M44 134 A58 58 0 0 0 156 134 Q100 122 44 134Z" fill="#b8925e"/>
      <ellipse cx="78" cy="118" rx="14" ry="9" fill="#5e9a48"/><ellipse cx="118" cy="114" rx="18" ry="11" fill="#3f7f36"/>
      <rect x="96" y="96" width="8" height="22" rx="4" fill="#6d9a57"/><circle cx="132" cy="122" r="6" fill="#9aa0a6"/>
      <circle cx="100" cy="120" r="58" fill="#fff" fill-opacity=".14" stroke="#a9c9ca" stroke-width="2.5"/>
      <ellipse cx="100" cy="64" rx="38" ry="5" fill="none" stroke="#a9c9ca" stroke-width="2.5"/>
      <path d="M60 92 Q64 72 78 66" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  if (a.kind === "potonly") {
    plant += `<ellipse cx="100" cy="178" rx="50" ry="7" fill="#000" opacity=".1"/>
      <path d="M60 56 H140 L130 176 H70 Z" fill="url(#${id}p)"/><rect x="54" y="48" width="92" height="13" rx="3" fill="url(#${id}p)"/>
      <path d="M72 66 L77 166" stroke="#fff" stroke-width="6" opacity=".2" stroke-linecap="round"/>`;
  }
  if (a.kind === "tool") {
    plant += `<ellipse cx="100" cy="150" rx="60" ry="6" fill="#000" opacity=".07"/>
      <g transform="rotate(-28 100 100)"><rect x="40" y="92" width="70" height="12" rx="6" fill="#e2b43a"/><rect x="40" y="108" width="70" height="12" rx="6" fill="#2d4f9a"/>
      <path d="M108 92 L170 96 L112 104Z" fill="#9aa3ad"/><path d="M108 118 L168 110 L112 108Z" fill="#c5ccd3"/><circle cx="112" cy="106" r="6" fill="#222"/></g>`;
  }

  const potColor = a.pot || "#efebe3";
  const bg = a.bg === "transparent" ? "" : `<rect x="-400" y="-400" width="1000" height="1000" fill="url(#${id}b)"/>`;
  return `<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" class="art">
    <defs>
      <radialGradient id="${id}b" gradientUnits="userSpaceOnUse" cx="100" cy="80" r="160"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}p" x1="0" x2="1"><stop offset="0" stop-color="${potColor}"/><stop offset=".6" stop-color="${potColor}"/><stop offset="1" stop-color="${potColor}" stop-opacity=".82"/></linearGradient>
    </defs>
    ${a.bg === "transparent" ? "" : `<rect x="-400" y="-400" width="1000" height="1000" fill="${a.bg || "#f2f0ea"}"/>`}${bg}
    <g transform="translate(100 104) scale(.9) translate(-100 -104)">${plant}</g></svg>`;
}
