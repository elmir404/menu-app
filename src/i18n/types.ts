export interface Dictionary {
  meta: {
    title: string;
    description: string;
    keywords: string;
  };
  nav: {
    home: string;
    restaurant: string;
    menu: string;
    checkout: string;
    language: string;
  };
  home: {
    hero: {
      badge: string;
      title: string;
      subtitle: string;
      cta: string;
      ctaSecondary: string;
    };
    features: {
      title: string;
      subtitle: string;
      items: { title: string; description: string }[];
    };
    howItWorks: {
      title: string;
      subtitle: string;
      steps: { step: string; title: string; description: string }[];
    };
    testimonials: {
      title: string;
      items: { quote: string; author: string; role: string }[];
    };
    cta: {
      title: string;
      subtitle: string;
      button: string;
    };
    pricing: {
      title: string;
      subtitle: string;
      free: string;
      pro: string;
      enterprise: string;
      month: string;
      features: {
        free: string[];
        pro: string[];
        enterprise: string[];
      };
    };
  };
  footer: {
    description: string;
    product: string;
    company: string;
    legal: string;
    features: string;
    pricing: string;
    about: string;
    contact: string;
    privacy: string;
    terms: string;
    rights: string;
  };
  restaurant: {
    loading: string;
    error: string;
    rateUs: string;
    tryOurFlavors: string;
    wifi: string;
    network: string;
    password: string;
    copy: string;
    copied: string;
    contact: string;
    location: string;
    ratingTitle: string;
    close: string;
    name: string;
    yourName: string;
    comment: string;
    commentPlaceholder: string;
    submit: string;
  };
  menu: {
    loading: string;
    error: string;
    prep: string;
    min: string;
    addToCart: string;
    viewOrder: string;
    yourOrder: string;
    emptyCart: string;
    total: string;
    proceedToCheckout: string;
    listView: string;
    gridView: string;
    decrease: string;
    increase: string;
  };
  checkout: {
    title: string;
    description: string;
    backToMenu: string;
  };
}
