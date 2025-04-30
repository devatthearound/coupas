import { ProductData } from "@/services/coupang/types";
import Image from "next/image";

type ProductCardProps = {
    product: ProductData;
    isSelected: boolean;
    selectIndex: number;
    onSelect: () => void;
}

function ProductCard({ product, 
    isSelected, 
    selectIndex, 
    onSelect 
}: ProductCardProps) {
    return (
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm
          border-2 transition-colors cursor-pointer
          ${isSelected
            ? 'border-[#514FE4] dark:border-[#6C63FF]'
            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        onClick={onSelect}
      >
        {isSelected && (
          <div className="absolute top-2 left-2 z-10 w-8 h-8 bg-[#514FE4] dark:bg-[#6C63FF] 
            rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            {selectIndex}    
          </div>
        )}
        <div className="relative aspect-square">
          <Image
            src={product.productImage}
            alt={product.productName}
            className="w-full h-full object-contain p-4"
            width={100}
            height={100}
          />
        </div>
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
            {product.productName}
          </h3>
          <p className="text-lg font-bold text-[#514FE4] dark:text-[#6C63FF]">
            {product.productPrice.toLocaleString()}원
          </p>
        </div>
      </div>
    );
  }

export default ProductCard;