// Views for DealBoard: every page is built from the deal data, with all
// values escaped before they reach the page. The verdict is the board's
// whole point — it is computed from the numbers, not typed in by hand:
// a deal counts as a REAL DEAL when it is 40% off or more, or the reporting
// called it an all-time low / first-ever cut; a GOOD DEAL is 20–39% off;
// anything smaller is CHECK FIRST, because a small cut on a new product is
// the shape a fake "sale" usually takes.

export const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const usd = (n) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export const pctOff = (d) => Math.round((1 - d.price / d.was) * 100);

export const saveAmount = (d) => d.was - d.price;

export const verdict = (d) => {
  const pct = pctOff(d);
  if (pct >= 40 || d.atl) return { key: "real", label: "Real deal", mark: "★" };
  if (pct >= 20) return { key: "good", label: "Good deal", mark: "◆" };
  return { key: "check", label: "Check first", mark: "!" };
};

export const checkedLabel = (iso) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

const categoryIcon = (category) => {
  const icons = {
    Audio: "♪",
    Computers: "▣",
    TVs: "▦",
    "Smart home": "⌂",
    Gaming: "▶",
    Kitchen: "♨",
    Home: "✦",
    Toys: "⬢",
    Wearables: "◷",
  };
  return icons[category] ?? "•";
};

export function dealCard(d) {
  const v = verdict(d);
  return `<article class="card verdict-${v.key}">
  <a class="card-link" href="#/deal/${encodeURIComponent(d.id)}" aria-label="${escape(d.title)}">
    <div class="card-top">
      <span class="cat"><span class="cat-icon" aria-hidden="true">${categoryIcon(d.category)}</span>${escape(d.category)}</span>
      <span class="pct">−${pctOff(d)}%</span>
    </div>
    <h3>${escape(d.title)}</h3>
    <p class="store-line">${escape(d.store)}</p>
    <p class="price-line"><span class="price">${usd(d.price)}</span> <s class="was">${usd(d.was)}</s></p>
    <p class="save-line">You save ${usd(saveAmount(d))}</p>
    <p class="verdict verdict-${v.key}"><span aria-hidden="true">${v.mark}</span> ${v.label}${d.atl ? " · all-time low" : ""}</p>
  </a>
</article>`;
}

export function board(deals, total) {
  if (deals.length === 0) {
    return `<div class="empty">
      <p class="empty-big">No deal matches.</p>
      <p>Try a shorter search, another store, or a lower discount floor.</p>
    </div>`;
  }
  return `<div class="grid">${deals.map(dealCard).join("")}</div>`;
}

export function detail(d, related) {
  const v = verdict(d);
  const pct = pctOff(d);
  const meter = Math.min(100, pct);
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail verdict-${v.key}">
  <div class="detail-head">
    <p class="detail-cat"><span class="cat-icon" aria-hidden="true">${categoryIcon(d.category)}</span>${escape(d.category)} · ${escape(d.store)}</p>
    <h1>${escape(d.title)}</h1>
    <p class="verdict verdict-${v.key} big"><span aria-hidden="true">${v.mark}</span> ${v.label}${d.atl ? " · all-time low" : ""}</p>
  </div>
  <div class="detail-body">
    <div class="price-box">
      <p class="price-big">${usd(d.price)}</p>
      <p class="was-big">Usually ${usd(d.was)} — <strong>−${pct}%</strong>, you save ${usd(saveAmount(d))}</p>
      <div class="meter" role="img" aria-label="${pct}% off"><span style="width:${meter}%"></span></div>
      <p class="meter-labels"><span class="m0">0%</span><span class="m20">20% · good deal</span><span class="m40">40% · real deal</span></p>
      <p><a class="cta" href="${escape(d.url)}" target="_blank" rel="noopener">See it at ${escape(d.store)} &rarr;</a></p>
      <p class="cta-note">Opens the store's own listing in a new tab. DealBoard takes no cut.</p>
    </div>
    <div class="fact-box">
      <h2>Why this verdict</h2>
      <p>${escape(d.note)}</p>
      <dl>
        <dt>Sale price</dt><dd>${usd(d.price)}</dd>
        <dt>Usual price</dt><dd>${usd(d.was)}</dd>
        <dt>Discount</dt><dd>${pct}% off — save ${usd(saveAmount(d))}</dd>
        <dt>Store</dt><dd>${escape(d.store)}</dd>
        <dt>Category</dt><dd>${escape(d.category)}</dd>
        <dt>Price checked</dt><dd>${checkedLabel(d.checked)}</dd>
        <dt>Read in</dt><dd>${escape(d.source)}</dd>
      </dl>
    </div>
  </div>
</article>
${related.length ? `<section class="related"><h2>More ${escape(d.category)} deals</h2><div class="grid">${related.map(dealCard).join("")}</div></section>` : ""}`;
}

export function missing() {
  return `<div class="empty">
    <p class="empty-big">No deal at this address.</p>
    <p><a href="#/">See all checked deals</a>.</p>
  </div>`;
}

export function method() {
  return `<section class="method">
  <h2>How the board checks a deal</h2>
  <ol>
    <li><strong>Found, not fed.</strong> Every deal on this board was found by the agent reading live Black Friday and Cyber Monday coverage and the stores' own listings on 27 Nov 2026 — no sponsored placements, no copied roundup.</li>
    <li><strong>Two prices, both real.</strong> The sale price and the usual price are the ones the source showed at check time. The "was" price is the store's own list price, not an inflated sticker.</li>
    <li><strong>A verdict with a rule.</strong> 40% off or an all-time low earns <span class="verdict verdict-real">Real deal</span>; 20–39% earns <span class="verdict verdict-good">Good deal</span>; under 20% is <span class="verdict verdict-check">Check first</span> — a small cut is exactly how a fake sale looks.</li>
    <li><strong>Checked, then stamped.</strong> Each deal carries the time its price was checked. Prices move fast on Black Friday; if the store's price has changed, the board is out of date, not the store.</li>
  </ol>
  <p class="fine">DealBoard is an independent finder built for make.fun's Black Friday bounty. It is not affiliated with Amazon, Best Buy, Target, Walmart, or any brand on the board. Store links go straight to the store.</p>
</section>`;
}
