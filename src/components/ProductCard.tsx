import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  lang: string;
  currency: string;
}

const ProductCard = ({ product, lang, currency }: ProductCardProps) => {
  const name = lang === "ka" ? product.nameKa : product.nameEn;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow block"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.img}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          width={512}
          height={512}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm rounded-full p-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-1 mb-1.5">{name}</h3>
        <div className="flex items-center gap-1 mb-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < Math.floor(product.rating) ? "fill-star text-star" : "text-border"
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({product.rating})</span>
        </div>
        <p className="text-base font-bold text-foreground">
          {product.price} {currency}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
