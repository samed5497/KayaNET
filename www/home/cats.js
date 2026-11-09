/* KayaNET içerik listesi: ana sayfa ve İçerik Ekle sayfası paylaşır.
   Bölüm eklemek/çıkarmak için sadece burayı düzenle.
   zim: Kiwix dosya adının tarihsiz başı; url: zim olmayan servisler için sabit adres. */
const CATS = [
  { title:"Ansiklopedi", items:[
    { name:"Vikipedi (Türkçe)", desc:"Türkçe Vikipedi'nin resimli tam kopyası.", lang:"TR", size:"~9 GB", zim:"wikipedia_tr_all_maxi", search:true },
    { name:"Wikipedia (English)", desc:"Tüm İngilizce Wikipedia, resimleriyle birlikte.", lang:"EN", size:"~120 GB", zim:"wikipedia_en_all_maxi", search:true },
  ]},
  { title:"Türkçe Kitaplık", items:[
    { name:"Vikisözlük", desc:"Türkçe sözlük, köken bilgisi ve çeviriler.", lang:"TR", size:"~810 MB", zim:"wiktionary_tr_all", search:true },
    { name:"Vikikitap", desc:"Açık ders kitapları ve el kitapları.", lang:"TR", size:"~27 MB", zim:"wikibooks_tr_all" },
    { name:"Vikikaynak", desc:"Telifsiz metinler, kanunlar, klasikler.", lang:"TR", size:"~68 MB", zim:"wikisource_tr_all" },
    { name:"Vikisöz", desc:"Özlü sözler ve alıntılar.", lang:"TR", size:"~59 MB", zim:"wikiquote_tr_all" },
    { name:"iFixit (Türkçe)", desc:"Cihaz ve araç tamiri için Türkçe adım adım rehberler.", lang:"TR", size:"~3,6 GB", zim:"ifixit_tr_all", search:true },
    { name:"PhET Simülasyonları", desc:"Fizik, kimya ve matematik etkileşimli deneyleri.", lang:"TR", size:"~107 MB", zim:"phet_tr_all" },
  ]},
  { title:"Haritalar ve Navigasyon", items:[
    { name:"Dünya Haritası", desc:"Avrupa ve Orta Doğu sokak seviyesinde, dünyanın geri kalanı şehir seviyesinde.", lang:"—", size:"~40 GB", url:"/maps" },
  ]},
  { title:"Hayatta Kalma ve Hazırlık", items:[
    { name:"Afet Sonrası Kitaplığı", desc:"Barınak, enerji, tarım ve yeniden yapılanma üzerine kitaplar.", lang:"EN", size:"~615 MB", zim:"zimgit-post-disaster_en", search:true },
    { name:"Su Arıtma", desc:"İçme suyu bulma, arıtma ve saklama.", lang:"EN", size:"~20 MB", zim:"zimgit-water_en" },
    { name:"Gıda Hazırlama ve Saklama", desc:"Konserve, kurutma ve uzun süreli gıda saklama.", lang:"EN", size:"~93 MB", zim:"zimgit-food-preparation_en" },
    { name:"Düğümler Kitaplığı", desc:"Düğüm çeşitleri ve kullanım alanları.", lang:"EN", size:"~27 MB", zim:"zimgit-knots_en" },
    { name:"Ready.gov", desc:"ABD resmi afet hazırlık rehberleri: deprem, sel, yangın.", lang:"EN", size:"~1,9 GB", zim:"ready.gov_en_all", search:true },
    { name:"Low-tech Magazine", desc:"Elektriksiz ve düşük teknolojili pratik çözümler.", lang:"EN", size:"~670 MB", zim:"solar.lowtechmagazine.com_mul_all" },
    { name:"Appropedia", desc:"Uygun teknoloji wiki'si: su, güneş enerjisi, tarım, barınak.", lang:"EN", size:"~580 MB", zim:"appropedia_en_all", search:true },
  ]},
  { title:"Sağlık ve İlk Yardım", items:[
    { name:"WikiMed", desc:"Wikipedia'nın tıp maddeleri: hastalıklar, ilaçlar, anatomi.", lang:"EN", size:"~2 GB", zim:"wikipedia_en_medicine_maxi", search:true },
    { name:"MDWiki", desc:"Doktorlar tarafından düzenlenen tıp ansiklopedisi.", lang:"EN", size:"~2 GB", zim:"mdwiki_en_all_maxi", search:true },
    { name:"MedlinePlus", desc:"ABD Ulusal Tıp Kütüphanesi hasta bilgilendirme sayfaları.", lang:"EN", size:"~1,9 GB", zim:"medlineplus.gov_en_all", search:true },
    { name:"Tıp Kitaplığı", desc:"Temel tıp ve sağlık kitapları.", lang:"EN", size:"~67 MB", zim:"zimgit-medicine_en" },
    { name:"Askeri Sahra Tıbbı", desc:"Sahada travma ve yaralı bakımı (FAS).", lang:"EN", size:"~65 MB", zim:"irp.fas.org_en_military-medicine" },
    { name:"NHS İlaç Rehberi", desc:"İlaçların kullanımı, dozları ve yan etkileri.", lang:"EN", size:"~15 MB", zim:"nhs.uk_en_medicines" },
  ]},
  { title:"Tamir ve Beceriler", items:[
    { name:"iFixit", desc:"Cihaz ve araç tamiri için adım adım rehberler.", lang:"EN", size:"~3 GB", zim:"ifixit_en_all", search:true },
    { name:"Ev Tamiri (DIY)", desc:"Elektrik, tesisat ve yapı soruları.", lang:"EN", size:"—", zim:"diy.stackexchange.com_en_all" },
    { name:"Bahçecilik", desc:"Sebze yetiştirme, toprak ve bitki hastalıkları.", lang:"EN", size:"—", zim:"gardening.stackexchange.com_en_all" },
    { name:"Yemek Pişirme", desc:"Pişirme teknikleri ve gıda güvenliği.", lang:"EN", size:"—", zim:"cooking.stackexchange.com_en_all" },
    { name:"Amatör Telsiz", desc:"Telsiz kurulumu, anten ve haberleşme.", lang:"EN", size:"—", zim:"ham.stackexchange.com_en_all" },
    { name:"Araç Bakımı", desc:"Motor, fren ve araç arızaları.", lang:"EN", size:"—", zim:"mechanics.stackexchange.com_en_all" },
    { name:"Doğa ve Kamp", desc:"Kamp, yürüyüş ve doğada hayatta kalma.", lang:"EN", size:"—", zim:"outdoors.stackexchange.com_en_all" },
    { name:"Sürdürülebilirlik", desc:"Enerji, su ve kaynak tasarrufu.", lang:"EN", size:"—", zim:"sustainability.stackexchange.com_en_all" },
  ]},
  { title:"Eğitim", items:[
    { name:"Kolibri", desc:"Çevrimdışı dersler ve eğitim videoları.", lang:"—", size:"—", url:"/kolibri" },
  ]},
];
