/* KayaNET dil katmanı (TR/EN). Ana sayfa ve Admin Console aynı dosyayı kullanır.
   KayaNET language layer (TR/EN). Shared by the homepage and the Admin Console.

   Kullanım / usage:
     KN.init({ base:"tr", dict:"/home/i18n/home-en.json", onChange: fn })
   base : sayfanın kaynak dili (HTML'de yazılı dil)
   dict : kaynak dil metninden diğer dile çeviri sözlüğü (JSON, {"metin":"text"})
   Sözlükte olmayan metin olduğu gibi kalır. Dil seçimi localStorage "kn_lang" içinde,
   ana sayfa ve /admin arasında ortaktır. */
(function () {
  var KEY = "kn_lang", LANGS = ["tr", "en"];
  var KN = window.KN = { lang: "tr", base: "tr", dict: {}, rules: [], listeners: [] };

  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(l) { try { localStorage.setItem(KEY, l); } catch (e) {} }

  /* Çeviri: kaynak dilse aynen, değilse sözlük ya da kural. / Translate a source-language string. */
  KN.t = function (s) {
    if (KN.lang === KN.base || s == null) return s;
    var k = norm(s);
    if (KN.dict[k] !== undefined) return KN.dict[k];
    for (var i = 0; i < KN.rules.length; i++) {
      var m = k.match(KN.rules[i][0]);
      if (m) return k.replace(KN.rules[i][0], KN.rules[i][1]);
    }
    return s;
  };

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };
  var INLINE = { B: 1, I: 1, EM: 1, STRONG: 1, A: 1, SPAN: 1, U: 1, SMALL: 1 };
  var BLOCK = { P: 1, LI: 1, DIV: 1, TD: 1, LABEL: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1 };
  var ATTRS = ["placeholder", "title", "aria-label", "value"];
  var applying = false;

  function inlineOnly(el) {
    if (!el.children.length) return false;
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i];
      if (!INLINE[c.tagName] || c.children.length > 1) return false;
      if (c.tagName === "A" && c.getAttribute("href") && c.getAttribute("href").charAt(0) !== "#" && c.getAttribute("href").indexOf("http") !== 0) return false;
    }
    return true;
  }

  function walk(root) {
    if (!root || root.nodeType === 8) return;
    if (root.nodeType === 3) return text(root);
    if (root.nodeType !== 1 || SKIP[root.tagName] || root.hasAttribute("data-kn-skip")) return;
    /* Satır içi biçimli bloklar (ör. "... <b>Reboot</b> ...") bütün olarak çevrilir. */
    if (BLOCK[root.tagName] && inlineOnly(root)) {
      if (root.__knHtml === undefined || root.__knOut !== root.innerHTML) { root.__knHtml = root.innerHTML; root.__knKey = norm(root.textContent); }
      var tr = KN.lang === KN.base ? null : KN.dict["h:" + root.__knKey];
      var out = tr !== undefined && tr !== null ? tr : root.__knHtml;
      if (root.innerHTML !== out) root.innerHTML = out;
      root.__knOut = root.innerHTML;
      if (tr !== undefined && tr !== null) return;
    }
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!root.hasAttribute(a)) continue;
      if (a === "value" && !(root.tagName === "INPUT" && /^(button|submit)$/.test(root.type))) continue;
      var key = "__kn_" + a, cur = root.getAttribute(a);
      if (root[key] === undefined || root[key + "o"] !== cur) root[key] = cur;
      var t = KN.t(root[key]);
      if (t !== cur) root.setAttribute(a, t);
      root[key + "o"] = root.getAttribute(a);
    }
    for (var n = root.firstChild; n; n = n.nextSibling) walk(n);
  }

  function text(node) {
    var v = node.data;
    if (node.__knSrc === undefined || node.__knOut !== v) node.__knSrc = v;
    if (!/\S/.test(node.__knSrc)) return;
    var t = KN.t(node.__knSrc);
    if (t !== node.__knSrc) {
      var lead = node.__knSrc.match(/^\s*/)[0], trail = node.__knSrc.match(/\s*$/)[0];
      t = lead + t + trail;
    }
    if (t !== v) node.data = t;
    node.__knOut = node.data;
  }

  function apply(root) { applying = true; try { walk(root || document.body); } finally { applying = false; } }
  KN.apply = apply;

  KN.set = function (l) {
    if (LANGS.indexOf(l) < 0) return;
    KN.lang = l; store(l);
    document.documentElement.lang = l;
    apply(document.body);
    if (document.title) document.title = KN.titleOf ? KN.titleOf(l) : document.title;
    var sw = document.getElementById("kn-lang");
    if (sw) [].forEach.call(sw.querySelectorAll("button"), function (b) { b.classList.toggle("on", b.dataset.l === l); });
    KN.listeners.forEach(function (f) { try { f(l); } catch (e) {} });
  };

  function switcher() {
    if (document.getElementById("kn-lang")) return;
    var d = document.createElement("div");
    d.id = "kn-lang"; d.setAttribute("data-kn-skip", "");
    d.innerHTML = '<button data-l="tr" title="Türkçe">TR</button><button data-l="en" title="English">EN</button>';
    d.onclick = function (e) { var b = e.target.closest("button"); if (b) KN.set(b.dataset.l); };
    document.body.appendChild(d);
    var css = document.createElement("style");
    css.textContent =
      "#kn-lang{position:fixed;top:10px;right:12px;z-index:99999;display:flex;border-radius:999px;overflow:hidden;" +
      "box-shadow:0 2px 10px rgba(0,0,0,.25);font:700 12px/1 system-ui,sans-serif}" +
      "#kn-lang button{border:0;background:#fff;color:#14202e;padding:8px 12px;cursor:pointer;letter-spacing:.5px}" +
      "#kn-lang button.on{background:#0b6bcb;color:#fff}";
    document.head.appendChild(css);
  }

  /* opts: base, dict (URL), rules ([[RegExp, repl]]), titleOf(lang), onChange(lang) */
  KN.init = function (opts) {
    KN.base = opts.base || "tr";
    KN.rules = opts.rules || [];
    KN.titleOf = opts.titleOf || null;
    if (opts.onChange) KN.listeners.push(opts.onChange);
    var want = stored();
    KN.lang = LANGS.indexOf(want) >= 0 ? want : (opts.defaultLang || KN.base);
    var go = function () {
      switcher();
      KN.set(KN.lang);
      /* Sonradan eklenen/değişen içeriği (admin paneli sürekli üretir) izle */
      new MutationObserver(function (recs) {
        if (applying || KN.lang === KN.base) return;
        applying = true;
        try {
          recs.forEach(function (r) {
            if (r.type === "characterData") text(r.target);
            else if (r.type === "attributes") walk(r.target);
            else [].forEach.call(r.addedNodes, function (n) { walk(n.nodeType === 1 && n.parentNode ? n.parentNode : n); });
          });
        } finally { applying = false; }
      }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "value"] });
    };
    var ready = function () { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go(); };
    if (!opts.dict) return ready();
    fetch(opts.dict, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; }).then(function (j) { KN.dict = j; ready(); });
  };
})();
