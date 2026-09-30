/* ARTMEAT stock manager - persistent via localStorage.
   Add before </body>:  <script src="stock.js"></script>          */
(function () {
  const KEY = "artmeat_stock_v1";
  const LOW = 5; // items at or below this show a warning

  const DEFAULTS = [
    { name: "Beef patty", qty: 0, unit: "pcs" },
    { name: "Bread (buns)", qty: 0, unit: "pcs" },
    { name: "Sauce - Ketchup", qty: 0, unit: "bottles" },
    { name: "Sauce - Mayo", qty: 0, unit: "bottles" },
    { name: "Cheese", qty: 0, unit: "slices" },
    { name: "Lettuce", qty: 0, unit: "pcs" },
    { name: "Tomato", qty: 0, unit: "pcs" },
    { name: "Onion", qty: 0, unit: "pcs" },
    { name: "Pickles", qty: 0, unit: "pcs" },
  ];

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(d)) return d;
    } catch (e) {}
    return DEFAULTS.map((x) => ({ ...x }));
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { alert("Could not save stock"); }
  }
  let items = load();

  /* ---------- Public API for your order code ---------- */
  window.ArtStock = {
    get: () => items.map((x) => ({ ...x })),
    // ArtStock.has({"Beef patty":1,"Bread (buns)":1}) -> true/false
    has(need) {
      return Object.entries(need).every(([n, q]) => {
        const it = items.find((x) => x.name === n);
        return !it || it.qty >= q;
      });
    },
    // ArtStock.consume({"Beef patty":1,"Bread (buns)":1}) - call when an order is saved
    consume(used) {
      Object.entries(used).forEach(([n, q]) => {
        const it = items.find((x) => x.name === n);
        if (it) it.qty = Math.max(0, it.qty - q);
      });
      save(); render();
    },
  };

  /* ---------- UI ---------- */
  const css = document.createElement("style");
  css.textContent = `
  #stk-btn{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9998;
    padding:12px 18px;border:0;border-radius:999px;background:#c0392b;color:#fff;font:600 15px system-ui,sans-serif;
    box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer}
  #stk-ov{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:none;align-items:flex-end;justify-content:center}
  #stk-ov.open{display:flex}
  #stk-box{background:#fff;color:#222;width:100%;max-width:560px;max-height:88vh;overflow:auto;border-radius:16px 16px 0 0;
    padding:18px;font:15px system-ui,sans-serif}
  #stk-box h2{margin:0 0 4px;font-size:20px}
  #stk-box p{margin:0 0 12px;color:#666;font-size:13px}
  .stk-row{display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #eee}
  .stk-row .n{flex:1;min-width:0}
  .stk-row input{width:74px;padding:8px;border:1px solid #ccc;border-radius:8px;font-size:16px;text-align:center}
  .stk-row .u{width:52px;color:#777;font-size:12px}
  .stk-row.low .n{color:#c0392b;font-weight:600}
  .stk-row button{border:0;background:none;color:#999;font-size:18px;cursor:pointer}
  .stk-add{display:flex;gap:8px;margin-top:12px}
  .stk-add input{flex:1;padding:8px;border:1px solid #ccc;border-radius:8px;font-size:16px;min-width:0}
  .stk-add button,.stk-foot button{padding:9px 14px;border:0;border-radius:8px;background:#222;color:#fff;cursor:pointer;font-size:14px}
  .stk-foot{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
  .stk-foot .g{background:#eee;color:#222}
  @media(prefers-color-scheme:dark){#stk-box{background:#1e1e1e;color:#eee}.stk-row{border-color:#333}
   .stk-row input,.stk-add input{background:#2a2a2a;color:#eee;border-color:#444}.stk-foot .g{background:#333;color:#eee}
   #stk-box p{color:#aaa}}`;
  document.head.appendChild(css);

  const btn = document.createElement("button");
  btn.id = "stk-btn"; btn.textContent = "📦 Stock";
  const ov = document.createElement("div");
  ov.id = "stk-ov";
  ov.innerHTML = `<div id="stk-box">
    <h2>Stock</h2><p>Edit the numbers any time. Saved automatically on this device.</p>
    <div id="stk-list"></div>
    <div class="stk-add"><input id="stk-name" placeholder="New item (e.g. Bacon)"><input id="stk-unit" placeholder="unit" style="max-width:80px"><button id="stk-addbtn">Add</button></div>
    <div class="stk-foot"><button id="stk-export" class="g">Backup</button><button id="stk-import" class="g">Restore</button><button id="stk-close">Done</button></div>
  </div>`;
  document.body.append(btn, ov);

  function render() {
    const list = document.getElementById("stk-list");
    if (!list) return;
    list.innerHTML = "";
    items.forEach((it, i) => {
      const r = document.createElement("div");
      r.className = "stk-row" + (it.qty <= LOW ? " low" : "");
      r.innerHTML = `<span class="n"></span><input type="number" min="0" inputmode="numeric"><span class="u"></span><button title="Remove">✕</button>`;
      r.querySelector(".n").textContent = it.name + (it.qty <= LOW ? " ⚠" : "");
      r.querySelector(".u").textContent = it.unit;
      const inp = r.querySelector("input"); inp.value = it.qty;
      inp.onchange = () => { it.qty = Math.max(0, parseFloat(inp.value) || 0); save(); render(); };
      r.querySelector("button").onclick = () => { if (confirm("Remove " + it.name + "?")) { items.splice(i, 1); save(); render(); } };
      list.appendChild(r);
    });
  }

  btn.onclick = () => { render(); ov.classList.add("open"); };
  document.getElementById("stk-close").onclick = () => ov.classList.remove("open");
  ov.onclick = (e) => { if (e.target === ov) ov.classList.remove("open"); };
  document.getElementById("stk-addbtn").onclick = () => {
    const n = document.getElementById("stk-name").value.trim();
    if (!n) return;
    items.push({ name: n, qty: 0, unit: document.getElementById("stk-unit").value.trim() || "pcs" });
    document.getElementById("stk-name").value = ""; document.getElementById("stk-unit").value = "";
    save(); render();
  };
  document.getElementById("stk-export").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }));
    a.download = "artmeat-stock-" + new Date().toISOString().slice(0, 10) + ".json"; a.click();
  };
  document.getElementById("stk-import").onclick = () => {
    const f = document.createElement("input"); f.type = "file"; f.accept = ".json";
    f.onchange = () => f.files[0].text().then((t) => {
      try { const d = JSON.parse(t); if (Array.isArray(d)) { items = d; save(); render(); } } catch (e) { alert("Invalid file"); }
    });
    f.click();
  };
  render();
})();
