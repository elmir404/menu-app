import type { Dictionary } from "../types";

const az: Dictionary = {
  meta: {
    title: "Menyu Platforması — Rəqəmsal Menyu Həlli",
    description:
      "Restoranınız üçün müasir rəqəmsal menyu həlli. QR menyu, onlayn sifariş və daha çoxu.",
    keywords: "rəqəmsal menyu, restoran, QR menyu, onlayn sifariş, Azərbaycan",
  },
  nav: {
    home: "Ana Səhifə",
    restaurant: "Restoran",
    menu: "Menyu",
    checkout: "Sifariş",
    language: "Dil",
  },
  home: {
    hero: {
      badge: "Yeni nəsil restoran idarəetməsi",
      title: "Restoranınızı rəqəmsallaşdırın",
      subtitle:
        "QR menyudan onlayn sifarişə qədər — müasir restoran idarəetmə platforması ilə müştəri təcrübəsini artırın.",
      cta: "Pulsuz başla",
      ctaSecondary: "Menyuya bax",
    },
    features: {
      title: "Xüsusiyyətlər",
      subtitle: "Restoranınız üçün lazım olan hər şey",
      items: [
        {
          title: "QR Menyu",
          description:
            "Müştərilər QR kodu skan edərək menyunuzu anında görə bilər.",
        },
        {
          title: "Onlayn Sifariş",
          description:
            "Masadan birbaşa sifariş verin, gözləmə vaxtını azaldın.",
        },
        {
          title: "Çox dilli dəstək",
          description:
            "Menyunuzu Azərbaycan, İngilis və Rus dillərində təqdim edin.",
        },
        {
          title: "Analitika",
          description:
            "Satış statistikası və müştəri davranışını real vaxtda izləyin.",
        },
        {
          title: "Kolay inteqrasiya",
          description:
            "Mövcud POS sisteminizlə asanlıqla inteqrasiya edin.",
        },
        {
          title: "Mobil uyğunluq",
          description:
            "Bütün cihazlarda mükəmməl görünüm — telefon, planşet, kompüter.",
        },
      ],
    },
    howItWorks: {
      title: "Necə işləyir?",
      subtitle: "3 addımda başlayın",
      steps: [
        {
          step: "1",
          title: "Qeydiyyatdan keçin",
          description: "Restoranınızı platformada qeydiyyatdan keçirin.",
        },
        {
          step: "2",
          title: "Menyunuzu yükləyin",
          description: "Kateqoriya, məhsul və qiymətlərinizi daxil edin.",
        },
        {
          step: "3",
          title: "İstifadəyə başlayın",
          description:
            "QR kodu çap edin və müştəriləriniz üçün aktivləşdirin.",
        },
      ],
    },
    testimonials: {
      title: "Müştərilərimiz nə deyir",
      items: [
        {
          quote: "Bu platforma xidmət keyfiyyətimizi tamamilə dəyişdi.",
          author: "Əli Həsənov",
          role: "Restoran sahibi",
        },
        {
          quote: "Sifariş prosesi çox sadə və sürətlidir.",
          author: "Leyla Əliyeva",
          role: "Kafe meneceri",
        },
        {
          quote: "Çox dilli dəstək beynəlxalq qonaqlarımız üçün ideal.",
          author: "Rəşad Məmmədov",
          role: "Otel restoranı müdiri",
        },
      ],
    },
    cta: {
      title: "Hazırsınız?",
      subtitle: "Bu gün pulsuz sınaq versiyasına başlayın.",
      button: "Pulsuz başla",
    },
    pricing: {
      title: "Qiymətlər",
      subtitle: "Hər ölçüdə restoran üçün plan",
      free: "Pulsuz",
      pro: "Pro",
      enterprise: "Müəssisə",
      month: "/ay",
      features: {
        free: [
          "1 restoran",
          "QR menyu",
          "Əsas analitika",
        ],
        pro: [
          "5 restoran",
          "Onlayn sifariş",
          "Tam analitika",
          "Çox dilli",
        ],
        enterprise: [
          "Limitsiz restoran",
          "API girişi",
          "Xüsusi inteqrasiya",
          "Prioritet dəstək",
        ],
      },
    },
  },
  footer: {
    description: "Restoranlar üçün müasir rəqəmsal menyu platforması.",
    product: "Məhsul",
    company: "Şirkət",
    legal: "Hüquqi",
    features: "Xüsusiyyətlər",
    pricing: "Qiymətlər",
    about: "Haqqımızda",
    contact: "Əlaqə",
    privacy: "Gizlilik",
    terms: "Şərtlər",
    rights: "Bütün hüquqlar qorunur.",
  },
  restaurant: {
    loading: "Restoran yüklənir...",
    error: "Restoran məlumatı yüklənmədi.",
    rateUs: "Bizi qiymətləndirin",
    tryOurFlavors: "Dadlarımızı yoxlayın",
    wifi: "WiFi məlumatları",
    network: "Şəbəkə",
    password: "Şifrə",
    copy: "Kopyala",
    copied: "Kopyalandı",
    contact: "Əlaqə",
    location: "Yer",
    ratingTitle: "Bu restoranı qiymətləndirin",
    close: "Bağla",
    name: "Ad",
    yourName: "Adınız",
    comment: "Rəy",
    commentPlaceholder: "Nəyi bəyəndiyinizi yazın...",
    submit: "Göndər",
  },
  menu: {
    loading: "Menyu yüklənir...",
    error: "Menyu yüklənmədi.",
    prep: "Hazırlıq",
    min: "dəq",
    addToCart: "Səbətə əlavə et",
    viewOrder: "Sifarişə bax",
    yourOrder: "Sifarişiniz",
    emptyCart: "Səbətiniz boşdur.",
    total: "Cəmi",
    proceedToCheckout: "Ödənişə keç",
    listView: "Siyahı görünüşü",
    gridView: "Şəbəkə görünüşü",
    decrease: "Azalt",
    increase: "Artır",
  },
  checkout: {
    title: "Sifariş",
    description: "Sifariş səhifəsi tezliklə. Sifariş xülasəsi və ödəniş burada olacaq.",
    backToMenu: "Menyuya qayıt",
  },
};

export default az;
