import { ProductData } from './types';

interface SearchProductsParams {
  keyword: string;
  limit: number;
  accessKey: string;
  secretKey: string;
}

interface SearchResponse {
  rCode: string;
  rMessage?: string;
  data?: {
    productData: ProductData[];
  };
}

export async function searchProducts({
  keyword,
  limit,
  accessKey,
  secretKey,
}: SearchProductsParams): Promise<ProductData[]> {
  const response = await fetch(
    `/api/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
    {
      headers: {
        'X-Coupang-Access-Key': accessKey,
        'X-Coupang-Secret-Key': secretKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`검색 요청 실패: ${response.status}`);
  }

  const data: SearchResponse = await response.json();

  if (data.rCode === '0' && data.data?.productData) {
    return data.data.productData;
  }

  throw new Error(data.rMessage || '검색 결과를 불러올 수 없습니다');
} 