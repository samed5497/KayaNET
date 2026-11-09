/* KayaNET üst durum çubuğu: batarya, CPU, RAM, sıcaklık. Giriş gerektirmez; ana sayfa ve /admin'de görünür.
   KayaNET top status bar: battery, CPU, RAM, temperature. No login needed; shown on the homepage and /admin.
   Veri: /home/stats.json (scripts/stats.sh). Batarya yoksa "—" gösterilir. */
(function () {
  var css = document.createElement("style");
  css.textContent =
    "#kn-bar{position:fixed;top:10px;right:104px;z-index:99998;display:flex;gap:6px;font:600 12px/1 system-ui,sans-serif}" +
    "#kn-bar span{background:#fff;color:#14202e;border-radius:999px;padding:8px 10px;box-shadow:0 2px 10px rgba(0,0,0,.2);white-space:nowrap}" +
    "#kn-bar .w{background:#d98a00;color:#fff}#kn-bar .b{background:#d33a2c;color:#fff}#kn-bar .g{background:#1a9d5b;color:#fff}" +
    "#kn-bar button{border:0;border-radius:999px;width:34px;height:31px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.2);cursor:pointer;font-size:14px}" +
    "body{padding-top:48px!important}@media (max-width:560px){#kn-bar .x{display:none}#kn-bar{right:96px}}";
  document.head.appendChild(css);
  var bar = document.createElement("div"); bar.id = "kn-bar"; bar.setAttribute("data-kn-skip", "");
  var pills = document.createElement("div"); pills.style.cssText = "display:flex;gap:6px"; bar.appendChild(pills);
  var en = function () { return window.KN && KN.lang === "en"; };
  var cls = function (p) { return p >= 90 ? "b" : p >= 75 ? "w" : ""; };
  function draw(s) {
    var h = "", tr = !en();
    var bt = s.battery;
    if (bt && bt.pct != null) {
      var c = bt.pct <= 15 ? "b" : bt.pct <= 30 ? "w" : (bt.status === "charging" ? "g" : "");
      h += '<span class="' + c + '" title="' + (tr ? "Batarya" : "Battery") + (bt.volt ? " " + bt.volt + " V" : "") + '">' + (bt.status === "charging" ? "⚡" : "🔋") + " " + Math.round(bt.pct) + "%</span>";
    } else h += '<span title="' + (tr ? "Batarya sensörü bağlı değil" : "No battery sensor connected") + '">🔋 —</span>';
    var mu = s.mem.total - s.mem.avail, rp = Math.round(100 * mu / s.mem.total);
    h += '<span class="' + cls(s.cpu) + '">CPU ' + s.cpu + "%</span>";
    h += '<span class="' + cls(rp) + '">RAM ' + rp + "%</span>";
    if (s.temp != null) h += '<span class="x ' + (s.temp >= 80 ? "b" : s.temp >= 70 ? "w" : "") + '">' + Math.round(s.temp) + "°C</span>";
    if (bar.__h !== h) { bar.__h = h; pills.innerHTML = h; }
  }
  /* Tema: açık (varsayılan) / koyu. Seçim localStorage "kn_theme"; ana sayfa ve /admin ortak. */
  var theme = document.createElement("button"); theme.id = "kn-theme"; theme.setAttribute("data-kn-skip", "");
  function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem("kn_theme", t); } catch (e) {} theme.textContent = t === "dark" ? "☀" : "🌙"; }
  theme.onclick = function () { setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); };
  var last = null;
  function poll() {
    fetch("/home/stats.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (s) { if (s) { last = s; draw(s); } }).catch(function () {});
  }
  function go() {
    var t0 = "light"; try { t0 = localStorage.getItem("kn_theme") || "light"; } catch (e) {}
    setTheme(t0); bar.appendChild(theme); document.body.appendChild(bar); poll();
    setInterval(function () { if (!document.hidden) poll(); }, 5000);
    if (window.KN) KN.listeners.push(function () { if (last) draw(last); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
