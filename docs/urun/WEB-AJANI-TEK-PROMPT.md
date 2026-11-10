codlai.com/apps sayfasına KayaNET ürününü ekle ve /apps/kayanet/ detay sayfasını oluştur.

KAYNAKLAR (hepsi herkese açık, indirip siteye kopyala)
- Ürün dökümanı: https://raw.githubusercontent.com/samed5497/kayanet/claude/project-thread-5inq01/docs/urun/README.md
- Görsel klasörü (GitHub): https://github.com/samed5497/kayanet/tree/claude/project-thread-5inq01/docs/urun/ekran-goruntuleri
- Görsel ham adresi kalıbı: https://raw.githubusercontent.com/samed5497/kayanet/claude/project-thread-5inq01/docs/urun/ekran-goruntuleri/<dosya>
- Mac'te yerel kopya (git pull + dal claude/project-thread-5inq01 sonrası): ~/Projeler/CODLAI/Yazilimlar/KayaNET/docs/urun/
Önce README.md'yi oku; metni oradaki bilgilere dayandır, özellik uydurma.

GÖRSELLER (her birinin _ust.png sürümü 1280x800 ekran, uzun sürümü tam sayfa; web için _ust olanları kullan, WebP'ye çevir, lazy-load, alt metin ekle)
- ana-sayfa-tr-light-masaustu-ust.png → kart görseli, hero, OG görseli
- ana-sayfa-tr-dark-masaustu-ust.png → koyu tema
- ana-sayfa-tr-light-mobil-ust.png → telefon görünümü
- ana-sayfa-en-light-masaustu-ust.png → İngilizce arayüz
- icerik-ekle-tr-light-masaustu-ust.png → İçerik Ekle
- acil-durum-tr-light-masaustu-ust.png → Acil Durum rehberi
- ayarlar-tr-light-masaustu-ust.png → opsiyonel
Not: görseller canlı cihaz değil, sayfaların örnek verilerle render'ıdır; galeri altına "Görseller örnek verilerle gösterilmiştir." yaz.

1) /apps SAYFASINA KART
Mevcut kartların bileşen ve stilini aynen kullan. H2: KayaNET. Durum etiketi: Geliştiriliyor. Açıklama: "İnternet ve şebeke olmadan çalışan, kendi Wi-Fi ağını yayan çevrimdışı bilgi arşivi. Telefon veya bilgisayarla bağlanın; Vikipedi, tıp, hayatta kalma, tamir ve eğitim içeriklerine tarayıcıdan ulaşın." Maddeler: Kendi Wi-Fi ağı (KayaNET), kurulum gerektirmez · Türkçe/İngilizce arayüz · Çevrimdışı yerel yapay zeka asistanı (geliştiriliyor) · Acil durum rehberi (AFAD, CDC, EPA kaynaklı) · Raspberry Pi üzerinde, açık kaynak temelli. "Detayları gör" → /apps/kayanet/. Altbilgideki Uygulamalar listesine KayaNET ekle. Diğer kartlara dokunma.

2) /apps/kayanet/ DETAY SAYFASI
Diğer ürün detay sayfalarının (ör. /apps/kefilo/) şablonunu baz al. Başlık: "KayaNET — Çevrimdışı bilgi arşivi | CODLAI". Ton sade, "siz" dili, abartısız. Bölümler: (1) Hero: "İnternet kesilse de bilgi sizde." + alt başlık + masaüstü görseli; (2) Nasıl çalışır: cihazı açın → KayaNET Wi-Fi'ına bağlanın → tarayıcıdan ulaşın; (3) Özellikler ızgarası (README tablosundan); (4) Ekran görüntüleri galerisi; (5) Kimler için: afet hazırlığı, tekne/karavan/kır evi, çevrimdışı sınıf, saha ekipleri; (6) Teknik bilgi (açılır): Raspberry Pi 4B/5, microSD veya SSD, Pi OS Lite 64-bit, Internet-in-a-Box, Kiwix, nginx, llama.cpp + Qwen3, Argos Translate; temel proje HAS_Prepper_Disk (MIT); içerik lisansları sahiplerine aittir; (7) İletişim bileşeni + "Haber verin" CTA. Yapay zeka asistanı "yakında/doğrulama sürüyor" notuyla yazılsın. Meta description: "KayaNET, internet olmadan çalışan, kendi Wi-Fi ağını yayan çevrimdışı bilgi arşividir. CODLAI Teknoloji AŞ."

3) BONUS (ayrı iş, önce bana raporla): Tezgaha, PartCrest, SMSmart, MyTime, Wearapp kartlarında yalnızca simge var, ekran görüntüsü/ayrıntı yok. Aynı bölüm iskeletini bu sayfalar için hazırla, eksik içerikleri uydurma, boş bırakıp bana listele.

4) FOTO BÖLÜMÜ (yalnız dosyalar varsa)
Şu klasörde gerçek cihaz fotoğrafları olup olmadığına bak: docs/urun/foto/ (kayanet-cihaz.jpg, kayanet-hotspot-telefon.jpg, kayanet-kullanim.jpg; GitHub: https://github.com/samed5497/kayanet/tree/claude/project-thread-5inq01/docs/urun/foto). Dosya varsa /apps/kayanet/img/ altına WebP olarak kopyala ve detay sayfasına "Cihaz" bölümü ekle (alt metinli, lazy-load). Dosya yoksa bölümü ekleme, yer tutucu da koyma, sadece bana "foto bekleniyor" de. Hiçbir görseli üretme veya stok foto kullanma.

5) DOĞRULAMA NOTU
Detay sayfasındaki yapay zeka "yakında/doğrulama sürüyor" notunu ben onay verene kadar KALDIRMA (takip: docs/urun/TAKIP.md).

KONTROL: bitince 390 px mobil ve masaüstünde ekran görüntüsü alıp doğrula; değiştirdiğin dosyaların listesini ver.
