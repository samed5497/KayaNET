/* KayaNET: Kiwix içerik sayfalarına üst şerit + "Sayfayı çevir" (yerel Argos, internetsiz).
   nginx sub_filter ile /kiwix/content/ sayfalarına eklenir (scripts/install-kiwix-overlay.sh). */
(function () {
  if (window.__knKiwix) return; window.__knKiwix = true;
  var framed = window.top !== window, $ = function (t, p, h) { var e = document.createElement(t); if (p) e.style.cssText = p; if (h) e.innerHTML = h; return e; };
  var tr = (document.documentElement.lang || "").slice(0, 2) === "tr";
  var H = 44, viewer = /^\/kiwix\/viewer/.test(location.pathname);
  var btn = "border:0;border-radius:8px;padding:6px 10px;font:600 13px system-ui;cursor:pointer;background:#fff;color:#0b6bcb;text-decoration:none;white-space:nowrap";
  var bar = $("div", "position:fixed;top:0;left:0;right:0;height:" + H + "px;z-index:2147483000;display:flex;gap:6px;align-items:center;padding:0 10px;overflow-x:auto;overflow-y:hidden;background:#0b6bcb;color:#fff;font:600 13px system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.3)");
  var sel = $("select", btn), go = $("button", btn + ";background:#ffd24a;color:#14202e", "🌐 Sayfayı çevir"), st = $("span", "font-weight:500;font-size:12px;opacity:.95;white-space:nowrap");
  sel.innerHTML = '<option value="en-tr">EN → TR</option><option value="tr-en">TR → EN</option>'; sel.value = tr ? "tr-en" : "en-tr";
  var chips = $("span", "display:flex;gap:5px;margin-left:auto;font-size:12px");
  if (!framed) {
    bar.innerHTML = '<a href="/home/" style="' + btn + '">🏠 KayaNET</a><button id="knb" style="' + btn + '">◀</button><button id="knf" style="' + btn + '">▶</button>' +
      '<a href="/home/acil.html" style="' + btn + ';background:#d33a2c;color:#fff">Acil</a><a href="/kiwix/" style="' + btn + '">Kütüphane</a>' +
      '<form id="knq" style="display:flex;gap:4px;margin:0"><input id="knqi" placeholder="Ara…" style="border:0;border-radius:8px;padding:6px 10px;width:150px;font:13px system-ui"><button style="' + btn + '">Ara</button></form>';
    bar.appendChild(go); bar.appendChild(sel); bar.appendChild(st); bar.appendChild(chips);
    document.documentElement.appendChild(bar);
    var bd = document.body.style; bd.position = "relative"; bd.transform = "translateZ(0)"; bd.marginTop = H + "px";
    if (viewer) bd.height = "calc(100vh - " + H + "px)"; else bd.minHeight = "calc(100vh - " + H + "px)";
    document.getElementById("knb").onclick = function () { history.back(); }; document.getElementById("knf").onclick = function () { history.forward(); };
    document.getElementById("knq").onsubmit = function (e) {
      e.preventDefault(); var q = document.getElementById("knqi").value.trim(); if (!q) return;
      var m = /^\/kiwix\/viewer$/.test(location.pathname) && location.hash.match(/^#([^\/]+)/);
      location.href = m ? "/kiwix/search?books.name=" + encodeURIComponent(m[1]) + "&pattern=" + encodeURIComponent(q) : "/kiwix/search?books.filter.lang=tur&pattern=" + encodeURIComponent(q);
    };
    var pst = function () { fetch("/home/stats.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (s) {
      var rp = Math.round(100 * (s.mem.total - s.mem.avail) / s.mem.total), c = function (v) { return v >= 90 ? "#d33a2c" : v >= 75 ? "#d98a00" : "#fff"; };
      var bt = s.battery && s.battery.pct != null ? "🔋" + Math.round(s.battery.pct) + "%" : "🔋—";
      chips.innerHTML = [bt, "CPU " + s.cpu + "%", "RAM " + rp + "%", s.temp != null ? Math.round(s.temp) + "°C" : ""].filter(Boolean).map(function (t, i) { var v = i === 1 ? s.cpu : i === 2 ? rp : 0; return '<span style="background:' + c(v) + ';color:' + (c(v) === "#fff" ? "#0b6bcb" : "#fff") + ';border-radius:999px;padding:4px 8px">' + t + "</span>"; }).join(""); }).catch(function () {}); };
    pst(); setInterval(function () { if (!document.hidden) pst(); }, 5000);
  }

  /* Kütüphane ana sayfası (/kiwix/): kitap açıklamaları Türkçeleşsin (sözlük + yerel çeviri yedeği, önbellekli) */
  var DICT = {
    "An Offline Version of Wikisource in Turkish Language": "Vikikaynak'ın Türkçe çevrimdışı sürümü",
    "An Offline Version of Wikibook in Turkish Language": "Vikikitap'ın Türkçe çevrimdışı sürümü",
    "An Offline Version of Turkish in Afrikaans Language": "Vikisöz'ün Türkçe çevrimdışı sürümü",
    "An Offline Version of Wikiquote in Turkish Language": "Vikisöz'ün Türkçe çevrimdışı sürümü"
  };
  var RULE = /^An Offline Version of (?:Turkish|Wikiquote)\b.*Language$/;
  if (/^\/kiwix\/?$/.test(location.pathname)) {
    var LK = "kn_desc:", ENG = /\b(the|of|in|and|for|with|offline|version|from|to|is|are)\b/i, busyL = false, applying = false;
    var fixDesc = async function () {
      if (busyL) return; busyL = true;
      try {
        var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), list = [], n;
        while ((n = w.nextNode())) { var t = n.data.trim(); if (t.length > 20 && t.indexOf(" ") > 0 && ENG.test(t) && !bar.contains(n) && !/^(SCRIPT|STYLE)$/.test(n.parentNode.tagName)) list.push([n, t]); }
        for (var i = 0; i < list.length; i++) {
          var node = list[i][0], txt = list[i][1], out = DICT[txt] || (RULE.test(txt) ? "Vikisöz'ün Türkçe çevrimdışı sürümü" : null);
          if (!out) { try { out = localStorage.getItem(LK + txt); } catch (e) {} }
          if (!out) { try { out = await xl(txt, "en-tr"); try { localStorage.setItem(LK + txt, out); } catch (e) {} } catch (e) { continue; } }
          applying = true; node.data = out; applying = false;
        }
      } finally { busyL = false; }
    };
    var tm; new MutationObserver(function () { if (applying) return; clearTimeout(tm); tm = setTimeout(fixDesc, 400); }).observe(document.body, { childList: true, subtree: true });
    setTimeout(fixDesc, 600);
  }

  /* PDF bağlantıları indirmesin: yerleşik görüntüleyicide açılsın */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin === location.origin && /\.pdf$/i.test(u.pathname)) { e.preventDefault(); (window.top || window).location.href = "/home/pdf.html?src=" + encodeURIComponent(u.pathname + u.search); }
  }, true);

  var nodes = [], busy = false, stop = false, on = false, CK = "kn_tc:";
  function tdoc() { var f = document.querySelector("iframe"); try { if (viewer && f && f.contentDocument && f.contentDocument.body) return f.contentDocument; } catch (e) {} return document; }
  function collect() {
    var D = tdoc(), w = D.createTreeWalker(D.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      var p = n.parentNode; if (!p || (n.ownerDocument === document && bar.contains(n)) || !/[A-Za-zÇĞİÖŞÜçğıöşü]{2}/.test(n.data)) return NodeFilter.FILTER_REJECT;
      if (/^(SCRIPT|STYLE|CODE|PRE|TEXTAREA|NOSCRIPT)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT; } });
    var a = [], n; while ((n = w.nextNode())) { if (n.__src === undefined) n.__src = n.data; a.push(n); }
    /* görünen kısımdan başla */
    a.sort(function (x, y) { var ry = x.parentNode.getBoundingClientRect().top, rz = y.parentNode.getBoundingClientRect().top; var vy = ry < 0 ? 1e9 - ry : ry, vz = rz < 0 ? 1e9 - rz : rz; return vy - vz; });
    return a;
  }
  function xl(q, d) {
    var key = CK + d + ":" + q; try { var c = sessionStorage.getItem(key); if (c) return Promise.resolve(c); } catch (e) {}
    var s = d.split("-");
    return fetch("/kn-translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: q, source: s[0], target: s[1] }) })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j.translatedText) throw 0; try { sessionStorage.setItem(key, j.translatedText); } catch (e) {} return j.translatedText; });
  }
  async function run() {
    busy = true; stop = false; on = true; go.textContent = "⏹ Durdur"; var d = sel.value; nodes = collect(); var i = 0;
    for (; i < nodes.length && !stop; i++) {
      var n = nodes[i], src = n.__src.trim(); st.textContent = "Çevriliyor " + (i + 1) + "/" + nodes.length + " (yerel, internetsiz)";
      try { var out = await xl(src, d); var lead = n.__src.match(/^\s*/)[0], trail = n.__src.match(/\s*$/)[0]; n.data = lead + out + trail; }
      catch (e) { st.textContent = "Çeviri servisi yanıt vermedi."; break; }
    }
    busy = false; go.textContent = "↩ Aslına dön"; if (i >= nodes.length) st.textContent = "Bitti. Makine çevirisi, hatalı olabilir.";
  }
  function revert() { nodes.forEach(function (n) { if (n.__src !== undefined) n.data = n.__src; }); on = false; go.textContent = "🌐 Sayfayı çevir"; st.textContent = ""; }
  go.onclick = function () { if (busy) { stop = true; return; } if (on) revert(); else run(); };
})();
