import type { Dictionary } from "../types";

const en: Dictionary = {
  meta: {
    title: "Menu Platform — Digital Menu Solution",
    description:
      "Modern digital menu solution for your restaurant. QR menu, online ordering, and more.",
    keywords: "digital menu, restaurant, QR menu, online ordering, Azerbaijan",
  },
  nav: {
    home: "Home",
    restaurant: "Restaurant",
    menu: "Menu",
    checkout: "Checkout",
    language: "Language",
  },
  home: {
    hero: {
      badge: "Next-gen restaurant management",
      title: "Digitize your restaurant",
      subtitle:
        "From QR menus to online ordering — enhance customer experience with our modern restaurant management platform.",
      cta: "Get started free",
      ctaSecondary: "View menu",
    },
    features: {
      title: "Features",
      subtitle: "Everything you need for your restaurant",
      items: [
        {
          title: "QR Menu",
          description:
            "Customers scan a QR code and instantly view your menu.",
        },
        {
          title: "Online Ordering",
          description:
            "Order directly from the table and reduce wait times.",
        },
        {
          title: "Multi-language support",
          description:
            "Offer your menu in Azerbaijani, English, and Russian.",
        },
        {
          title: "Analytics",
          description:
            "Track sales stats and customer behavior in real time.",
        },
        {
          title: "Easy integration",
          description:
            "Integrate seamlessly with your existing POS system.",
        },
        {
          title: "Mobile friendly",
          description:
            "Perfect appearance on all devices — phone, tablet, desktop.",
        },
      ],
    },
    howItWorks: {
      title: "How it works",
      subtitle: "Get started in 3 steps",
      steps: [
        {
          step: "1",
          title: "Sign up",
          description: "Register your restaurant on the platform.",
        },
        {
          step: "2",
          title: "Upload your menu",
          description: "Enter your categories, products, and prices.",
        },
        {
          step: "3",
          title: "Go live",
          description: "Print the QR code and activate it for your customers.",
        },
      ],
    },
    testimonials: {
      title: "What our customers say",
      items: [
        {
          quote: "This platform completely transformed our service quality.",
          author: "Ali Hasanov",
          role: "Restaurant owner",
        },
        {
          quote: "The ordering process is very simple and fast.",
          author: "Leyla Aliyeva",
          role: "Cafe manager",
        },
        {
          quote: "Multi-language support is ideal for our international guests.",
          author: "Rashad Mammadov",
          role: "Hotel restaurant director",
        },
      ],
    },
    cta: {
      title: "Ready to start?",
      subtitle: "Start your free trial today.",
      button: "Get started free",
    },
    pricing: {
      title: "Pricing",
      subtitle: "Plans for restaurants of every size",
      free: "Free",
      pro: "Pro",
      enterprise: "Enterprise",
      month: "/mo",
      features: {
        free: [
          "1 restaurant",
          "QR menu",
          "Basic analytics",
        ],
        pro: [
          "5 restaurants",
          "Online ordering",
          "Full analytics",
          "Multi-language",
        ],
        enterprise: [
          "Unlimited restaurants",
          "API access",
          "Custom integrations",
          "Priority support",
        ],
      },
    },
  },
  footer: {
    description: "Modern digital menu platform for restaurants.",
    product: "Product",
    company: "Company",
    legal: "Legal",
    features: "Features",
    pricing: "Pricing",
    about: "About",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Terms",
    rights: "All rights reserved.",
  },
  restaurant: {
    loading: "Loading restaurant...",
    error: "Failed to load restaurant.",
    rateUs: "Rate us",
    tryOurFlavors: "Try our flavors",
    wifi: "WiFi details",
    network: "Network",
    password: "Password",
    copy: "Copy",
    copied: "Copied",
    contact: "Contact",
    location: "Location",
    ratingTitle: "Rate this restaurant",
    close: "Close",
    name: "Name",
    yourName: "Your name",
    comment: "Comment",
    commentPlaceholder: "Tell us what you liked...",
    submit: "Submit",
  },
  menu: {
    loading: "Loading menu...",
    error: "Failed to load menu.",
    prep: "Prep",
    min: "min",
    addToCart: "Add to cart",
    viewOrder: "View order",
    yourOrder: "Your order",
    emptyCart: "Your cart is empty.",
    total: "Total",
    proceedToCheckout: "Proceed to checkout",
    listView: "List view",
    gridView: "Grid view",
    decrease: "Decrease",
    increase: "Increase",
  },
  checkout: {
    title: "Checkout",
    description: "Checkout page is next. We will add order summary and payment here.",
    backToMenu: "Back to menu",
  },
};

export default en;
