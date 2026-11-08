/* KayaNET Admin Console katmanı: dil (TR/EN), açıklamalar, bağlı cihazlar.
   IIAB dosyalarına dokunmaz; nginx sub_filter ile sayfaya eklenir (bkz. scripts/install-admin-overlay.sh).
   Overlay for the IIAB Admin Console: language (TR/EN), explanations, connected devices.
   Does not modify IIAB files; injected by nginx sub_filter. */
(function () {
  var S = function (tr, en) { return '<span data-kn-l="tr">' + tr + '</span><span data-kn-l="en">' + en + '</span>'; };

  /* Günlük satırları gibi kalıp metinler / pattern strings (log lines etc.) */
  var RULES = [
    [/^(.*?)Command (\S+) sent to server$/, "$1$2 komutu sunucuya gönderildi"],
    [/^(.*?)(\S+) SUCCEEDED \((\d+) ms\)$/, "$1$2 BAŞARILI ($3 ms)"],
    [/^(.*?)(\S+) FAILED \((\d+) ms\)$/, "$1$2 BAŞARISIZ ($3 ms)"],
    [/^(.*?)Init Finished Successfully$/, "$1Başlatma başarıyla tamamlandı"],
    [/^(.*?)Successfully connected to Server$/, "$1Sunucuya başarıyla bağlanıldı"],
    [/^(.*?)Checking Server Connection$/, "$1Sunucu bağlantısı denetleniyor"],
    [/^(.*?)Connection to Server FAILED\.?$/, "$1Sunucu bağlantısı BAŞARISIZ"],
    [/^(.*?)Starting init$/, "$1Başlatılıyor"],
    [/^(.*?)procOneCatalog found empty data$/, "$1Katalog verisi boş (yeni kurulumda normal)"]
  ];

  KN.init({ base: "en", defaultLang: "tr", dict: "/home/i18n/admin-tr.json", rules: RULES,
    titleOf: function (l) { return l === "tr" ? "KayaNET Yönetim Paneli" : "KayaNET Admin Console"; } });

  /* --- Açıklama kutuları / info boxes --- */
  var BOXES = [
    { id: "controlBluetooth", where: "afterbegin", html:
      S('<b>Bluetooth Kontrolü ne işe yarar?</b> Telefonun KayaNET\'e Wi-Fi yerine <i>Bluetooth ağı (BT-PAN)</i> ile bağlanmasını sağlar; Wi-Fi sinyalinin zayıf olduğu ya da Wi-Fi\'ın kapatıldığı özel durumlar için yedek bir yoldur. <b>Normal kullanımda gerekmez</b>: KayaNET zaten kendi Wi-Fi ağını yayınlıyor. Bluetooth hızı çok düşüktür (sayfalar yavaş açılır), pil harcar ve güvenlik yüzeyini genişletir. Bu bölüm sunucuda BT-PAN servisi kurulu değilse yanıt vermeden beklemeye devam eder; bu yüzden önerimiz <b>kapalı bırakmaktır</b>. Açıldıysa ve yanıt gelmiyorsa sayfayı yenileyin.',
        '<b>What is Bluetooth Control for?</b> It lets a phone join KayaNET over a <i>Bluetooth network (BT-PAN)</i> instead of Wi-Fi, as a fallback when Wi-Fi is weak or turned off. <b>You normally do not need it</b>: KayaNET already broadcasts its own Wi-Fi. Bluetooth is very slow, drains battery and widens the attack surface. If the BT-PAN service is not installed on the server, this panel keeps waiting without a reply, so we recommend <b>leaving it off</b>. If it was turned on and nothing happens, refresh the page.') },
    { id: "controlWarning", where: "beforeend", html:
      '<h2>' + S('Bağlı cihazlar', 'Connected devices') + ' <small id="kn-devn"></small></h2><div id="kn-devs" class="kn-devs"></div>' },
    { id: "utilChgPW", where: "afterbegin", html:
      S('<b>Kullanıcı adı ve parola:</b> Yönetim paneline, KayaNET cihazındaki (Raspberry Pi) bir Linux kullanıcısıyla girilir; panel yalnızca <i>oturum açmış kullanıcının parolasını</i> değiştirir, kullanıcı adını değiştiremez. Farklı bir kullanıcı adı için SSH ile yeni kullanıcı ekleyin: <code>sudo adduser yeniad</code> ve <code>sudo usermod -aG sudo yeniad</code>; yönetim paneli her sudo üyesini kabul eder. <b>Güvenlik:</b> IIAB varsayılan <code>iiab-admin</code> (parola: g0admin) ve <code>pi</code> kullanıcılarının parolaları herkesçe bilinir; varsa değiştirin veya kullanıcıyı kilitleyin: <code>sudo passwd -l iiab-admin</code>.',
        '<b>Username and password:</b> The admin console signs in with a Linux user on the KayaNET device (Raspberry Pi). This panel only changes the <i>logged-in user\'s password</i>; it cannot rename the user. For another username, add a user over SSH: <code>sudo adduser newname</code> and <code>sudo usermod -aG sudo newname</code>; the console accepts any sudo member. <b>Security:</b> the IIAB default users <code>iiab-admin</code> (password g0admin) and <code>pi</code> have publicly known passwords; change them or lock the user: <code>sudo passwd -l iiab-admin</code>.') },
    { id: "instConStart", where: "afterbegin", html:
      S('<b>İçerik nereden iniyor?</b> Bu menüdeki her şey, cihaz <u>internete bağlıyken</u> indirilir ve diske kaydedilir; sonrasında internetsiz çalışır. <ul><li><b>Kiwix ZIM dosyaları</b> (Vikipedi, iFixit, tıp, kitaplar): download.kiwix.org sunucularından. Dosya adındaki tarih sürüm tarihidir.</li><li><b>OER2Go / RACHEL modülleri</b> (eğitim içeriği): rachel.worldpossible.org.</li><li><b>Harita bölgeleri</b> (OpenStreetMap): Internet-in-a-Box harita sunucusu; Türkiye\'den erişim engelli olabilir.</li></ul> Büyük dosyalar için SD kart/SSD\'de yeterli boş yer gerekir (üstteki <i>Available Storage</i> değerine bakın). İndirme işlerinin durumu: <i>Utilities → Display Job Status</i>. KayaNET\'in hazır küçük paketi için depodaki <code>scripts/download-content.sh</code> da kullanılabilir.',
        '<b>Where does content download from?</b> Everything in this menu downloads while the device is <u>online</u> and is stored on disk; afterwards it works offline. <ul><li><b>Kiwix ZIM files</b> (Wikipedia, iFixit, medical, books): from download.kiwix.org. The date in the file name is the release date.</li><li><b>OER2Go / RACHEL modules</b> (educational content): rachel.worldpossible.org.</li><li><b>Map regions</b> (OpenStreetMap): the Internet-in-a-Box map server; may be blocked from Turkey.</li></ul> Large files need enough free space on the SD card/SSD (see <i>Available Storage</i> above). Download progress: <i>Utilities → Display Job Status</i>. For KayaNET\'s ready-made small package you can also use <code>scripts/download-content.sh</code> from the repository.') }
  ];

  function inject() {
    BOXES.forEach(function (b) {
      var el = document.getElementById(b.id);
      if (!el || el.querySelector('[data-kn-box="' + b.id + '"]')) return;
      var d = document.createElement("div");
      d.setAttribute("data-kn-box", b.id); d.setAttribute("data-kn-skip", "");
      d.className = b.id === "controlWarning" ? "kn-box kn-plain" : "kn-box";
      d.innerHTML = b.html;
      el.insertAdjacentElement(b.where, d);
    });
    var hd = document.querySelector(".adm-cons-page-header");
    if (hd && !hd.querySelector(".kn-home")) {
      var a = document.createElement("a");
      a.className = "kn-home"; a.href = "/home/"; a.setAttribute("data-kn-skip", "");
      a.innerHTML = S("← Ana sayfa", "← Home");
      hd.insertBefore(a, hd.firstChild);
    }
  }

  var devData = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function drawDevs() {
    var box = document.getElementById("kn-devs"); if (!box || !devData) return;
    var tr = KN.lang === "tr", list = devData.devices || [], on = list.filter(function (x) { return x.online; }).length;
    var head = tr ? "(" + on + " bağlı / " + list.length + " bilinen)" : "(" + on + " online / " + list.length + " known)";
    var hn = document.getElementById("kn-devn"); if (hn.textContent !== head) hn.textContent = head;
    var html = list.length ? list.map(function (x) {
      return '<div class="kn-dv ' + (x.online ? "" : "off") + '"><i></i><div><b>' + esc(x.name || x.mac) + '</b><small>' + esc(x.ip || "") + ' · ' + esc(x.mac) +
        (x.online ? "" : " · " + (tr ? "bağlı değil" : "offline")) + (x.signal ? " · " + x.signal + " dBm" : "") + '</small></div></div>';
    }).join("") : '<p>' + (tr ? "Henüz cihaz yok" : "No devices yet") + '</p>';
    if (box.__html !== html) { box.__html = html; box.innerHTML = html; } /* aynıysa DOM'a dokunma: gözlemci döngüsünü önler */
  }
  function poll() {
    fetch("/home/devices.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) { devData = d; drawDevs(); } }).catch(function () {});
  }
  KN.listeners.push(drawDevs);

  function start() {
    new MutationObserver(function () { inject(); drawDevs(); }).observe(document.body, { childList: true, subtree: true });
    inject(); poll(); setInterval(function () { if (!document.hidden) poll(); }, 7000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
