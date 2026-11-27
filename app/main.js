// DealBoard's app: a hash-routed deal finder with search, filters and sort.
// No network at all — the deals live in data.js and the page only ever
// renders them. State lives in the hash so a filtered view has an address:
//
//   #/                                  the full board
//   #/?q=airpods&cat=Audio&store=Amazon&min=40&sort=discount
//   #/deal/<id>                         one deal
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals, categories, stores, CHECKED_LABEL } from "./data.js";
import { board, detail, missing, method, pctOff, saveAmount, usd } from "./views.js";

const app = document.getElementById("app");
const qInput = document.getElementById("q");
const catSel = document.getElementById("cat");
const storeSel = document.getElementById("store");
const minSel = document.getElementById("min");
const sortSel = document.getElementById("sort");
const resetBtn = document.getElementById("reset");
const countEl = document.getElementById("result-count");

function fillSelect(sel, items, allLabel) {
  sel.innerHTML = `<option value="">${allLabel}</option>` +
    items.map((x) => `<option value="${x}">${x}</option>`).join("");
}
fillSelect(catSel, categories, "All categories");
fillSelect(storeSel, stores, "All stores");

function readState() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [path, query] = hash.split("?");
  const params = new URLSearchParams(query ?? "");
  return {
    deal: path.startsWith("deal/") ? decodeURIComponent(path.slice(5)) : null,
    q: params.get("q") ?? "",
    cat: params.get("cat") ?? "",
    store: params.get("store") ?? "",
    min: Number(params.get("min") ?? 0) || 0,
    sort: params.get("sort") ?? "discount",
  };
}

function stateHash(s) {
  const params = new URLSearchParams();
  if (s.q) params.set("q", s.q);
  if (s.cat) params.set("cat", s.cat);
  if (s.store) params.set("store", s.store);
  if (s.min) params.set("min", String(s.min));
  if (s.sort && s.sort !== "discount") params.set("sort", s.sort);
  const query = params.toString();
  return `#/${query ? "?" + query : ""}`;
}

function applyFilters(all, s) {
  const q = s.q.trim().toLowerCase();
  let shown = all.filter(
    (d) =>
      (s.cat === "" || d.category === s.cat) &&
      (s.store === "" || d.store === s.store) &&
      pctOff(d) >= s.min &&
      (q === "" ||
        `${d.title} ${d.store} ${d.category} ${d.note}`.toLowerCase().includes(q)),
  );
  const by = {
    discount: (a, b) => pctOff(b) - pctOff(a) || saveAmount(b) - saveAmount(a),
    saving: (a, b) => saveAmount(b) - saveAmount(a),
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
  };
  shown = [...shown].sort(by[s.sort] ?? by.discount);
  return shown;
}

function renderStats(all) {
  const best = Math.max(...all.map(pctOff));
  const saved = all.reduce((sum, d) => sum + saveAmount(d), 0);
  document.getElementById("stat-deals").textContent = String(all.length);
  document.getElementById("stat-stores").textContent = String(stores.length);
  document.getElementById("stat-best").textContent = `−${best}%`;
  document.getElementById("stat-saved").textContent = usd(saved);
}

function render() {
  window.__shotReady = false;
  const s = readState();
  qInput.value = s.q;
  catSel.value = s.cat;
  storeSel.value = s.store;
  minSel.value = String(s.min);
  sortSel.value = s.sort;
  document.getElementById("controls").hidden = s.deal !== null;
  document.getElementById("stats").hidden = s.deal !== null;
  if (s.deal) {
    const found = deals.find((d) => d.id === s.deal);
    document.title = `${found ? found.title : "Not found"} | DealBoard`;
    if (found) {
      const related = deals
        .filter((d) => d.category === found.category && d.id !== found.id)
        .sort((a, b) => pctOff(b) - pctOff(a))
        .slice(0, 3);
      app.innerHTML = detail(found, related);
    } else {
      app.innerHTML = missing();
    }
    countEl.textContent = "";
  } else {
    document.title = "DealBoard — Black Friday deal finder";
    const shown = applyFilters(deals, s);
    app.innerHTML = board(shown, deals.length) + method();
    countEl.textContent = `${shown.length} deal${shown.length === 1 ? "" : "s"} · checked ${CHECKED_LABEL}`;
  }
  renderStats(deals);
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function pushState() {
  const s = {
    q: qInput.value,
    cat: catSel.value,
    store: storeSel.value,
    min: Number(minSel.value) || 0,
    sort: sortSel.value,
  };
  const next = stateHash(s);
  if (next !== location.hash) history.replaceState(null, "", next);
  render();
}

[qInput, catSel, storeSel, minSel, sortSel].forEach((el) =>
  el.addEventListener("input", pushState),
);
resetBtn.addEventListener("click", () => {
  qInput.value = "";
  catSel.value = "";
  storeSel.value = "";
  minSel.value = "0";
  sortSel.value = "discount";
  history.replaceState(null, "", "#/");
  render();
});

window.addEventListener("hashchange", render);
render();
