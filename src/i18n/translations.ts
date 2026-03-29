export type Language = "ka" | "en";

export const translations = {
  ka: {
    nav: {
      aboutUs: "ჩვენ შესახებ",
      blog: "ბლოგოს ნანახი",
      contact: "კონტაქტი",
      delivery: "მინოდება",
      returns: "ანგარიშსწორება",
      search: "სასურველი ნივთის ძიება",
      signIn: "შესვლა",
      categories: "კატეგორიები",
    },
    hero: {
      badge: "დამზადებულია",
      title: "ქართველი ოსტატის მიერ",
      cta: "ყიდვა",
    },
    categories: {
      title: "კატეგორიები",
      items: [
        "გამფურების ნაკრები",
        "საათი",
        "სანათი",
        "სასაჩუქრე ყუთი",
        "ფოტო ჩარჩო",
        "საბავშვო",
        "გამფურები",
        "კორპორატიული",
        "სხვადასხვა",
      ],
    },
    products: {
      title: "რეკომენდირებული პროდუქტები",
      currency: "₾",
    },
    footer: {
      contact: "დაგვიკავშირდით",
      rights: "ყველა უფლება დაცულია",
      phone: "+995 571 99 77 71",
      email: "sapovnela24@gmail.com",
    },
  },
  en: {
    nav: {
      aboutUs: "About Us",
      blog: "Blog",
      contact: "Contact",
      delivery: "Delivery",
      returns: "Returns",
      search: "Search products...",
      signIn: "Sign In",
      categories: "Categories",
    },
    hero: {
      badge: "Handcrafted",
      title: "By Georgian Masters",
      cta: "Shop Now",
    },
    categories: {
      title: "Categories",
      items: [
        "Cutting Board Sets",
        "Clocks",
        "Candle Holders",
        "Gift Boxes",
        "Photo Frames",
        "Kids",
        "Cutting Boards",
        "Corporate",
        "Other",
      ],
    },
    products: {
      title: "Recommended Products",
      currency: "₾",
    },
    footer: {
      contact: "Contact Us",
      rights: "All Rights Reserved",
      phone: "+995 571 99 77 71",
      email: "sapovnela24@gmail.com",
    },
  },
} as const;
