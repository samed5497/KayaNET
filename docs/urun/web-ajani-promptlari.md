# Web sitesi ajanı için promptlar (codlai.com/apps)

Gözlem (codlai.com/apps, 10.11.2026): sayfa kartlı yapıda. Her kart: ürün adı (H2), durum etiketi (Yayında / Yakında / Geliştiriliyor / Dahili test / Kapalı test), kısa açıklama, madde listesi, "Detayları gör" bağlantısı ve görsel (ekran görüntüsü ya da simge). Detay sayfaları `codlai.com/apps/<ürün>/` biçiminde (panel, tezgaha, partcrest, smsmart, kefilo, mytime, wearapp). Ton sade, "siz" dili. Çatı teknolojisi kesin belirlenemedi (büyük olasılıkla statik HTML; tahmin).

Görsellerin yeri: `samed5497/kayanet` reposu, `docs/urun/ekran-goruntuleri/` (dal `claude/project-thread-5inq01`, birleşince `main`). Ham adres: `https://raw.githubusercontent.com/samed5497/kayanet/<dal>/docs/urun/ekran-goruntuleri/<dosya>`. Repo gizliyse dosyaları Samed siteye elle yüklesin ya da ajan repo erişimiyle kopyalasın.

## Prompt 1 — Ürün kartı (apps ana sayfası)

```
codlai.com/apps sayfasına yeni bir ürün kartı ekle: "KayaNET".
- Mevcut kartların birebir aynı bileşenini/stilini kullan (H2 başlık, durum etiketi, kısa açıklama, 4-5 maddelik liste, "Detayları gör" linki, görsel).
- Durum etiketi: "Geliştiriliyor".
- Açıklama: "İnternet ve şebeke olmadan çalışan, kendi Wi-Fi ağını yayan çevrimdışı bilgi arşivi. Telefon veya bilgisayarla bağlanın; Vikipedi, tıp, hayatta kalma, tamir ve eğitim içeriklerine tarayıcıdan ulaşın."
- Maddeler: Kendi Wi-Fi ağı (KayaNET), kurulum gerektirmez · Türkçe/İngilizce arayüz · Çevrimdışı yerel yapay zeka asistanı (geliştiriliyor) · Acil durum rehberi (AFAD, CDC, EPA kaynaklı) · Raspberry Pi üzerinde, açık kaynak temelli.
- Görsel: docs/urun/ekran-goruntuleri/ana-sayfa-tr-light-masaustu-ust.png dosyasını sitenin görsel klasörüne kopyala (adı kayanet-ana-sayfa.png), diğer kartlarla aynı boyut/oranda göster, alt metni "KayaNET ana sayfası".
- Detay linki: /apps/kayanet/
- Mevcut diğer kartlara, sıralamaya, SEO başlığına ve altbilgideki "Uygulamalar" listesine dokunma; yalnızca altbilgi listesine "KayaNET" linkini ekle.
- Değişiklikten sonra mobilde (390 px) ve masaüstünde ekran görüntüsü alıp kontrol et.
```

## Prompt 2 — Detay sayfası (/apps/kayanet/)

```
codlai.com/apps/ altındaki diğer ürün detay sayfalarının (ör. /apps/kefilo/) şablonunu baz alarak /apps/kayanet/ sayfasını oluştur. Başlık: "KayaNET — Çevrimdışı bilgi arşivi | CODLAI". Durum: Geliştiriliyor (prototip). Ton: sade, "siz" dili, abartısız; doğrulanmamış hiçbir özelliği "hazır" gibi yazma.

Bölümler:
1. Hero: slogan "İnternet kesilse de bilgi sizde." + alt başlık "Kendi Wi-Fi ağını yayan çevrimdışı bilgi arşivi." + ana-sayfa-tr-light-masaustu-ust.png.
2. Nasıl çalışır (3 adım): Cihazı açın → "KayaNET" Wi-Fi ağına bağlanın → tarayıcıdan arşive ulaşın. Uygulama kurulumu yok.
3. Özellikler (kart ızgarası): Çevrimdışı kütüphane (Türkçe Vikipedi, tıp, hayatta kalma, su/gıda, tamir, amatör telsiz) · Acil Durum rehberi (AFAD, CDC, EPA kaynaklı) · TR/EN arayüz · Sistem ve bağlı cihaz paneli · İçerik Ekle (PIN korumalı) · Çevrimdışı çeviri TR⇄EN · Yerel yapay zeka asistanı "Sor" (kurulum/sahada doğrulama sürüyor, "yakında" notuyla) · HDMI ekran modu · Disk ve güç uyarıları.
4. Ekran görüntüleri galerisi: ana-sayfa-tr-dark-masaustu-ust.png, ana-sayfa-tr-light-mobil-ust.png, ana-sayfa-en-light-masaustu-ust.png, icerik-ekle-tr-light-masaustu-ust.png, acil-durum-tr-light-masaustu-ust.png. Altına küçük not: "Görseller örnek verilerle gösterilmiştir."
5. Kimler için: afet hazırlığı, tekne/karavan/kır evi, çevrimdışı sınıf, saha ekipleri.
6. Teknik bilgi (açılır bölüm): Raspberry Pi 4B/5, microSD veya SSD, Raspberry Pi OS Lite 64-bit, Internet-in-a-Box, Kiwix, nginx, llama.cpp + Qwen3, Argos Translate. Açık kaynak temel: HAS_Prepper_Disk (MIT). İçerik lisansları sahiplerine aittir.
7. İletişim / ilgilenenler için form veya mevcut iletişim bileşeni; "Haber verin" CTA'sı.

Altbilgi, menü ve gizlilik/KVKK linkleri diğer sayfalarla aynı kalsın. Meta description: "KayaNET, internet olmadan çalışan, kendi Wi-Fi ağını yayan çevrimdışı bilgi arşividir. CODLAI Teknoloji AŞ." Open Graph görseli: ana-sayfa-tr-light-masaustu-ust.png. Mobilde 390 px'te kontrol et.
```

## Prompt 3 — Genel iyileştirme (ekran görüntüsü/detay eksikliği)

```
codlai.com/apps sayfasında bazı kartlarda (Tezgaha, PartCrest, SMSmart, MyTime, Wearapp) yalnızca simge var; ekran görüntüsü ve ayrıntı yok. Şunları yap:
1. Bu kartlar için, ürün sahibinden gelecek ekran görüntüleri için yer tutucu galeri alanı hazırla (görsel yoksa simge kalsın, bozulma olmasın).
2. Her detay sayfasında aynı bölüm iskeletini kullan: Hero, Nasıl çalışır, Özellikler, Ekran görüntüleri, Teknik bilgi, İletişim.
3. Kartlardaki maddeleri 4-5 madde ve tek satırlık olacak şekilde standartlaştır.
4. Yeni görselleri WebP'ye çevir, lazy-load kullan, alt metin ekle.
Kendi başına ürün özelliği uydurma; içeriği olmayan alanı boş bırak ve bana listele.
```
