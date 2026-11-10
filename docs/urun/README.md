# KayaNET — CODLAI Teknoloji AŞ. ürün dosyası

> Durum: prototip, Pi 4B üzerinde çalışıyor. Yapay zeka asistanı ve bazı modüller sahada henüz doğrulanmadı (aşağıda "Doğrulama durumu").

## Tek cümle
KayaNET, internet ve elektrik şebekesi olmadan da çalışan, kendi Wi-Fi ağını (hotspot) yayan çevrimdışı bilgi arşividir. Telefon veya bilgisayar `KayaNET` ağına bağlanır, tarayıcıdan Vikipedi, tıp, hayatta kalma, tamir ve eğitim içeriklerine ulaşır.

## Kimler için
- Afet ve acil durum hazırlığı (deprem çantası, aile, belediye, STK)
- Tekne, karavan, araç, kır evi gibi bağlantısız ortamlar
- Çevrimdışı sınıf / eğitim kampı (Kolibri, PhET, Vikikitap)
- Saha ekipleri, uzak köy / okul

## Özellikler
| Alan | Ne yapar |
|---|---|
| Çevrimdışı kütüphane | Kiwix ZIM içerikleri: Türkçe Vikipedi, WikiMed, hayatta kalma, su/gıda, düğümler, ilaç rehberi, amatör telsiz, doğa/kamp |
| Kendi Wi-Fi ağı | Hotspot SSID `KayaNET`; bağlanan her cihaz tarayıcıdan kullanır, uygulama kurulumu gerekmez |
| Modern ana sayfa | Kart tabanlı, açık/koyu tema, mobil uyumlu, canlı filtre, kategori çipleri, tüm kütüphanede arama |
| TR / EN arayüz | Ana sayfa ve yönetim ekranı (/admin) iki dilli; seçim tarayıcıda saklanır |
| Acil Durum sayfası | AFAD, CDC, EPA kaynaklı, internetsiz açılan Türkçe rehber |
| Sistem kartı | CPU, RAM, takas, sıcaklık, disk, çalışma süresi, düşük voltaj uyarısı (5 sn'de bir) |
| Bağlı cihazlar | Hotspot'a bağlı cihaz listesi (ad, IP, sinyal) |
| İçerik Ekle | Cihazdan yeni içerik indirme ve yönetme sayfası, yönetici PIN'i ile korunur |
| Çevrimdışı çeviri | Argos Translate ile TR⇄EN; Kiwix sayfalarında "Sayfayı çevir" |
| Yerel yapay zeka ("Sor") | llama.cpp + Qwen3 (RAM'e göre 0.6B/1.7B/4B); soruyu Kiwix'te arar, kaynak linkli cevap verir. Veri dışarı çıkmaz |
| Ekran (HMI) modu | HDMI ekranda açılışta tam ekran KayaNET (fare/klavye çalışır) |
| Disk ve güç sağlığı | Disk dolması, SSD yıpranması, yetersiz güç için ana sayfada uyarı |
| Kolay geri alma | Yönetim ve Kiwix katmanları IIAB dosyalarına dokunmaz; `--remove` ile geri alınır |

## Donanım (prototip)
- Raspberry Pi 4B (1,8 GB kullanılabilir RAM), Armor tipi soğutucu fan
- 32 GB microSD (çekirdek içerik profili ~13 GB); sonra 2,5" SATA SSD + USB3 UASP adaptör (ASM1153E önerilir)
- 5 V / 3 A adaptör, UPS üzerinden
- İsteğe bağlı: HDMI ekran, RTC pili (Pi 5'te)
- Pi 5 + NVMe SSD profili de desteklenir (upstream yapı)

## Yazılım yığını
Raspberry Pi OS Lite 64-bit (trixie) · Internet-in-a-Box (IIAB) · Kiwix · nginx · llama.cpp + Qwen3 · Argos Translate · Kolibri (SSD profilinde).
Temel: açık kaynak [HAS_Prepper_Disk](https://github.com/schematrix/HAS_Prepper_Disk) (MIT); KayaNET arayüz, yapay zeka, çeviri, içerik yönetimi ve HMI katmanlarını ekler.

## Ağ bilgisi
Hotspot SSID `KayaNET`; kabloyla modeme bağlıyken ağdaki adresi `192.168.1.150` (sabit). Tarayıcıda `http://192.168.1.150/home/`.

## Doğrulama durumu
- Pi 4B'de kurulu ve çalışıyor: IIAB, Kiwix, hotspot, TR/EN ana sayfa, admin katmanı, sistem kartı, Argos çeviri paketleri.
- Pi'de henüz doğrulanmadı: yerel yapay zeka cevap kalitesi ve hızı (1,8 GB RAM'de küçük model), llama.cpp derlemesi, HMI ekran modu.
- Harita içeriği TR'de IIAB harita sunucusuna erişim kısıtı nedeniyle sorunlu olabilir (WARP gerekebilir).
- Tüm içerik lisansları kendi sahiplerine aittir (Wikipedia CC BY-SA, OSM ODbL vb.).

## Ekran görüntüleri
`ekran-goruntuleri/` klasörü. **Not:** repo'daki gerçek sayfa dosyaları yerel Chromium'da, örnek (sahte) sistem/cihaz verisiyle render edilmiştir; kütüphane listesi 32 GB SD profiline göredir. Cihazdaki canlı ekran görüntüsü değildir. Dosyalar:

| Dosya | İçerik |
|---|---|
| `ana-sayfa-tr-light-masaustu-ust.png` | Ana sayfa, TR, açık tema, masaüstü, ekranın üstü (kapak için en uygunu) |
| `ana-sayfa-tr-light-masaustu.png` | Aynısı, tam sayfa |
| `ana-sayfa-tr-dark-masaustu-ust.png` / `.png` | Koyu tema |
| `ana-sayfa-en-light-masaustu-ust.png` / `.png` | İngilizce arayüz |
| `ana-sayfa-tr-light-mobil-ust.png` / `.png` | Telefon görünümü (390×844) |
| `ana-sayfa-en-light-mobil-ust.png` / `.png` | Telefon, İngilizce |
| `icerik-ekle-tr-light-masaustu-ust.png` / `.png` | İçerik Ekle sayfası |
| `acil-durum-tr-light-masaustu-ust.png` / `.png` | Acil Durum rehberi |
| `ayarlar-tr-light-masaustu-ust.png` / `.png` | Ayarlar |

Gerçek cihaz fotoğrafı yoktur; Samed çekince `docs/urun/foto/` altına eklenmeli.

## Kısa metinler (web için)
- **Slogan:** İnternet kesilse de bilgi sende.
- **Alt başlık:** Kendi Wi-Fi ağını yayan çevrimdışı bilgi arşivi.
- **Durum etiketi önerisi:** "Geliştiriliyor" (prototip aşaması).
