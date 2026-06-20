import product1 from "@/assets/product1.jpg";
import product2 from "@/assets/product2.jpg";
import product3 from "@/assets/product3.jpg";
import product4 from "@/assets/product4.jpg";
import product5 from "@/assets/product5.jpg";
import product6 from "@/assets/product6.jpg";
import product7 from "@/assets/product7.jpg";
import product8 from "@/assets/product8.jpg";

export interface Product {
  id: string;
  img: string;
  images: string[];
  nameKa: string;
  nameEn: string;
  descKa: string;
  descEn: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  material: string;
  dimensions: string;
  inStock: boolean;
  personalizationEnabled?: boolean;
  personalizationNote?: string;
}

export const products: Product[] = [
  {
    id: "wall-clock-chukurtma",
    img: product1,
    images: [product1, product3, product5],
    nameKa: "კედლის საათი - ჩუქურთმა",
    nameEn: "Wall Clock - Chukurtma",
    descKa: "ხელნაკეთი კედლის საათი ტრადიციული ქართული ჩუქურთმა ორნამენტით. დამზადებულია მაღალი ხარისხის კაკლის ხისგან, ლაზერული გრავირებით. იდეალურია სახლის ან ოფისის დეკორაციისთვის.",
    descEn: "Handcrafted wall clock featuring traditional Georgian Chukurtma ornamental patterns. Made from premium walnut wood with laser engraving. Perfect for home or office decoration.",
    price: 190,
    rating: 4.8,
    reviews: 24,
    category: "clocks",
    material: "კაკალი / Walnut",
    dimensions: "30 × 30 × 3 სმ",
    inStock: true,
  },
  {
    id: "cutting-board-georgian",
    img: product2,
    images: [product2, product4, product6],
    nameKa: "ჭრის დაფა - ქართული სტილი",
    nameEn: "Cutting Board - Georgian Style",
    descKa: "ხელნაკეთი ჭრის დაფა ქართული ორნამენტებით. დამზადებულია ბზის ხისგან, დამუშავებულია საკვები ზეთით. პრაქტიკული და ლამაზი აქსესუარი თქვენი სამზარეულოსთვის.",
    descEn: "Handcrafted cutting board with Georgian ornamental designs. Made from boxwood, treated with food-safe oil. A practical and beautiful accessory for your kitchen.",
    price: 120,
    rating: 4.9,
    reviews: 37,
    category: "cutting-boards",
    material: "ბზა / Boxwood",
    dimensions: "40 × 25 × 2 სმ",
    inStock: true,
  },
  {
    id: "gift-box-ornamental",
    img: product3,
    images: [product3, product1, product7],
    nameKa: "სასაჩუქრე ყუთი",
    nameEn: "Gift Box - Ornamental",
    descKa: "ელეგანტური ხის სასაჩუქრე ყუთი ქართული ორნამენტით. შესანიშნავია საჩუქრების შეფუთვისა და შენახვისთვის. ხელნაკეთი და უნიკალური.",
    descEn: "Elegant wooden gift box with Georgian ornamental design. Perfect for gift wrapping and storage. Handmade and unique.",
    price: 85,
    rating: 4.7,
    reviews: 18,
    category: "gift-boxes",
    material: "კაკალი / Walnut",
    dimensions: "20 × 15 × 10 სმ",
    inStock: true,
  },
  {
    id: "wooden-domino-set",
    img: product4,
    images: [product4, product2, product8],
    nameKa: "ქართული ხის დომინო",
    nameEn: "Wooden Domino Set",
    descKa: "ხელნაკეთი ხის დომინოს ნაკრები ქართული მოტივებით. მოიცავს 28 ფიგურას და ხის ყუთს. იდეალური საჩუქარი ოჯახისა და მეგობრებისთვის.",
    descEn: "Handcrafted wooden domino set with Georgian motifs. Includes 28 pieces and a wooden box. An ideal gift for family and friends.",
    price: 65,
    rating: 4.6,
    reviews: 12,
    category: "other",
    material: "ბზა / Boxwood",
    dimensions: "18 × 10 × 5 სმ",
    inStock: true,
  },
  {
    id: "wine-bottle-holder",
    img: product5,
    images: [product5, product1, product3],
    nameKa: "ღვინის ბოთლის სადგამი",
    nameEn: "Wine Bottle Holder",
    descKa: "ორიგინალური ხის სადგამი ღვინის ბოთლისთვის. ქართული გრავირებით და უნიკალური დიზაინით. შესანიშნავი საჩუქარი ღვინის მოყვარულთათვის.",
    descEn: "Original wooden wine bottle holder with Georgian engraving and unique design. An excellent gift for wine lovers.",
    price: 150,
    rating: 5.0,
    reviews: 31,
    category: "other",
    material: "კაკალი / Walnut",
    dimensions: "25 × 12 × 15 სმ",
    inStock: true,
  },
  {
    id: "photo-frame-wood",
    img: product6,
    images: [product6, product8, product2],
    nameKa: "ფოტო ჩარჩო - ხის",
    nameEn: "Photo Frame - Wood",
    descKa: "ხელნაკეთი ხის ფოტო ჩარჩო ტრადიციული ქართული ორნამენტებით. განკუთვნილია 10×15 სმ ფოტოსთვის. ლამაზი დამატება თქვენი ინტერიერისთვის.",
    descEn: "Handmade wooden photo frame with traditional Georgian ornaments. Fits 10×15 cm photos. A beautiful addition to your interior.",
    price: 75,
    rating: 4.5,
    reviews: 15,
    category: "photo-frames",
    material: "ბზა / Boxwood",
    dimensions: "18 × 23 × 2 სმ",
    inStock: false,
  },
  {
    id: "honey-dipper-set",
    img: product7,
    images: [product7, product4, product6],
    nameKa: "თაფლის კოვზის ნაკრები",
    nameEn: "Honey Dipper Set",
    descKa: "ხელნაკეთი თაფლის კოვზების ნაკრები. 3 სხვადასხვა ზომის კოვზი ხის სადგამით. დამზადებულია ეკოლოგიურად სუფთა მასალისგან.",
    descEn: "Handcrafted honey dipper set. 3 different sized dippers with a wooden stand. Made from eco-friendly materials.",
    price: 45,
    rating: 4.8,
    reviews: 22,
    category: "other",
    material: "ბზა / Boxwood",
    dimensions: "15 × 3 სმ",
    inStock: true,
  },
  {
    id: "wall-decor-cross",
    img: product8,
    images: [product8, product5, product1],
    nameKa: "კედლის დეკორაცია",
    nameEn: "Wall Decor - Cross",
    descKa: "ხელნაკეთი კედლის დეკორაცია ქართული ჯვრის მოტივით. ლაზერული გრავირებით დამუშავებული. შესანიშნავი საჩუქარი და ინტერიერის დეკორაცია.",
    descEn: "Handcrafted wall decoration with Georgian cross motif. Processed with laser engraving. An excellent gift and interior decoration.",
    price: 110,
    rating: 4.9,
    reviews: 28,
    category: "other",
    material: "კაკალი / Walnut",
    dimensions: "25 × 25 × 1.5 სმ",
    inStock: true,
  },
];
