export interface ProductData {
  productId: string;
  productName: string;
  productPrice: number;
  originalPrice: number;
  productImage: string;
  productUrl: string;
  shortUrl: string;
  rating?: number;        // 평점 (별점)
  ratingCount?: number;   // 평점 갯수
  reviewCount: number;
  isRocket: boolean;
  isFreeShipping: boolean;
  features?: string;      // 특징
  category: string;
} 