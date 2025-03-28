'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ProductData } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import { LockClosedIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import JSZip from 'jszip';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProducts, setSelectedProducts] = useState<ProductData[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [commentTemplate, setCommentTemplate] = useState<'template1' | 'custom'>('template1');
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<string>('');

  useEffect(() => {
    const sessionKey = searchParams?.get('selectedProducts');
    if (sessionKey) {
      try {
        const products = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
        setSelectedProducts(products);
      } catch (error) {
        console.error('Failed to parse products:', error);
        toast.error('상품 정보를 불러올 수 없습니다');
      }
    }
  }, [searchParams]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    const newProducts = Array.from(selectedProducts);
    const [removed] = newProducts.splice(sourceIndex, 1);
    newProducts.splice(destinationIndex, 0, removed);

    // 순위 업데이트를 위해 새로운 배열로 상태 업데이트
    setSelectedProducts([...newProducts]);
  };

  const generateComment = (products: ProductData[]): string => {
    const header = "이 포스팅은 쿠팡파트너스 활동의 일환으로, 일정액의 수수료를 제공받습니다.\n\n";
    
    const templates = {
      template1: (product: ProductData, index: number) => 
        `🏆 ${index + 1}위 ${product.productName}\n` +
        `✨ 최저가: ${product.productPrice.toLocaleString()}원\n` +
        `${product.isRocket ? '🚀 로켓배송\n' : ''}` +
        `${product.isFreeShipping ? '🆓 무료배송\n' : ''}` +
        `\n구매링크: ${product.shortUrl}\n`,

      custom: (product: ProductData, index: number) =>
        customTemplate
          .replace('{index}', (index + 1).toString())
          .replace('{productName}', product.productName)
          .replace('{productPrice}', product.productPrice.toLocaleString())
          .replace('{shortUrl}', product.shortUrl)
          .replace('{isRocket}', product.isRocket ? '🚀 로켓배송' : '')
          .replace('{isFreeShipping}', product.isFreeShipping ? '무료배송 가능' : '')
    };

    const productsText = products.map((product, index) => 
      templates[commentTemplate === 'custom' ? 'custom' : commentTemplate](product, index)
    ).join('\n');

    return header + productsText;
  };

  const handleDownload = async () => {
    if (!selectedProducts.length) {
      toast.error('선택된 상품이 없습니다.');
      return;
    }

    let successCount = 0;
    const totalCount = selectedProducts.length;
    const zip = new JSZip();

    // 로딩 시작
    toast.loading('다운로드 준비 중...', { id: 'download' });

    try {
      // 댓글 텍스트 파일 추가
      const comments = generateComment(selectedProducts);
      zip.file('순위_댓글.txt', comments);

      // 이미지 다운로드 및 추가
      for (let index = 0; index < selectedProducts.length; index++) {
        const product = selectedProducts[index];
        // 파일명에서 특수문자 제거 및 길이 제한
        const sanitizedName = product.productName
          .replace(/[^a-zA-Z0-9가-힣]/g, '_')
          .slice(0, 30);
        const fileName = `${index + 1}위_${sanitizedName}.jpg`;

        try {
          // 서버 API를 통해 이미지 다운로드
          const response = await fetch(`/api/download-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: product.productImage }),
          });

          if (!response.ok) throw new Error('이미지 다운로드 실패');

          const blob = await response.blob();
          zip.file(`images/${fileName}`, blob);
          successCount++;
        } catch (error) {
          console.error(`Failed to download image for product: ${product.productName}`, error);
        }
      }

      // ZIP 파일 생성
      toast.loading('ZIP 파일 생성 중...', { id: 'download' });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // ZIP 파일 다운로드
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `순위_댓글_이미지_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 로딩 종료 및 결과 표시
      toast.dismiss('download');
      if (successCount === totalCount) {
        toast.success('댓글과 이미지가 ZIP 파일로 다운로드되었습니다!');
      } else {
        toast.success(`댓글과 ${successCount}/${totalCount}개의 이미지가 다운로드되었습니다`);
      }
    } catch (error) {
      console.error('ZIP 파일 생성 실패:', error);
      toast.error('ZIP 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsPreviewModalOpen(false);
    }
  };

  const handleDelete = (index: number) => {
    const newProducts = [...selectedProducts];
    newProducts.splice(index, 1);
    setSelectedProducts(newProducts);
    toast.success('상품이 삭제되었습니다');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">선택된 상품</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">2/3 단계</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
          <div className="overflow-x-auto">
              {/* Header */}
              <div 
                className="bg-gray-100 dark:bg-gray-800 grid gap-4 p-4 rounded-t-lg font-medium sticky top-0 z-10"
                style={{
                  gridTemplateColumns: '40px 80px 320px 112px 60px 1fr'
                }}
              >
                <div>순위</div>
                <div>이미지</div>
                <div>상품명</div>
                <div>가격</div>
                <div>특징</div>
                <div>제휴링크</div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="droppable">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="flex flex-col"
                      >
                        {selectedProducts.map((product, index) => (
                          <Draggable 
                            key={`${product.productId}-${index}`}
                            draggableId={`${product.productId}-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`grid gap-4 p-4 border-b border-gray-200 
                                  dark:border-gray-600 items-center
                                  ${snapshot.isDragging ? 'bg-gray-50' : 'bg-white'}
                                  dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                                  cursor-grab active:cursor-grabbing`}
                                style={{
                                  gridTemplateColumns: '40px 80px 320px 112px 60px 1fr 40px',
                                  ...provided.draggableProps.style
                                }}
                              >
                                <div className="font-bold text-lg text-[#514FE4] text-center">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="w-[50px] h-[50px] relative">
                                    <Image
                                      src={product.productImage}
                                      alt={product.productName}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <p className="line-clamp-2 text-sm">{product.productName}</p>
                                </div>
                                <div className="font-semibold">
                                  {product.productPrice.toLocaleString()}원
                                </div>
                                <div className="flex flex-col gap-1">
                                  {product.isRocket && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs text-center">
                                      로켓
                                    </span>
                                  )}
                                  {product.isFreeShipping && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs text-center">
                                      무료배송
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-500 truncate">{product.shortUrl}</p>
                                  <button
                                    onClick={() => window.electron.openExternal(product.shortUrl)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    title="브라우저에서 열기"
                                  >
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-500 hover:text-[#514FE4] dark:hover:text-[#6C63FF]" />
                                  </button>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(index);
                                  }}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                  title="삭제"
                                >
                                  <svg 
                                    className="w-5 h-5 text-red-500" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
            </div>
          </div>
        </div>
      </div>

      {/* 댓글 미리보기 모달 */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">댓글 미리보기</h3>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[80vh]">
            
              {/* 출력 형식 선택 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  {/* 아이콘 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      아이콘 선택
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setCommentTemplate('template1')}
                        className={`flex flex-col items-center p-3 border rounded-lg transition-colors
                          ${commentTemplate === 'template1' 
                            ? 'border-[#514FE4] bg-[#514FE4]/5' 
                            : 'hover:border-[#514FE4]'
                          }`}
                      >
                        <span className="text-2xl mb-1">🏆</span>
                        <span className="text-xs">기본</span>
                      </button>
                      <button 
                        onClick={() => setCommentTemplate('custom')}
                        className={`flex flex-col items-center p-3 border rounded-lg transition-colors
                          ${commentTemplate === 'custom' 
                            ? 'border-[#514FE4] bg-[#514FE4]/5' 
                            : 'hover:border-[#514FE4]'
                          }`}
                      >
                        <span className="text-2xl mb-1">✏️</span>
                        <span className="text-xs">사용자 정의</span>
                      </button>
                    </div>
                  </div>

                  {/* 사용자 정의 템플릿 입력 */}
                  {commentTemplate === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        사용자 정의 템플릿
                      </label>
                      <textarea 
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg 
                          text-gray-200 placeholder-gray-500"
                        placeholder="템플릿을 입력하세요. 예: {index}위 {productName} - {productPrice}원"
                        rows={4}
                        value={customTemplate}
                        onChange={(e) => setCustomTemplate(e.target.value)}
                      />
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        사용 가능한 변수: 
                        <ul className="list-disc list-inside">
                          <li><code>순위: {'{index}'}</code></li>
                          <li><code>상품명: {'{productName}'}</code></li>
                          <li><code>상품 가격: {'{productPrice}'}</code></li>
                          <li><code>상품 링크: {'{shortUrl}'}</code></li>
                          <li><code>로켓배송 여부: {'{isRocket}'}</code></li>
                          <li><code>무료배송 여부: {'{isFreeShipping}'}</code></li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 미리보기 */}
              <div className="p-4">
                <div className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 
                  bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {generateComment(selectedProducts)}
                </div>
              </div>

            </div>

            {/* 하단 버튼 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 
                  dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] 
                  dark:hover:bg-[#5B54E8] text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 출력형식 모달 */}
      {isFormatModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">출력 형식 설정</h3>
              <button
                onClick={() => setIsFormatModalOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    출력 형식
                  </label>
                  <textarea 
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg 
                      text-gray-200 placeholder-gray-500"
                    placeholder="출력 형식을 입력하세요"
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setIsFormatModalOpen(false)}
                className="px-4 py-2 bg-[#514FE4] text-white rounded-lg hover:bg-[#4140B3]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md 
        border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedProducts.length}개 선택됨
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 
                  dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                이전
              </button>
              
              
              {/* 다운로드 버튼 */}
              <div className="relative group">
                <button
                  onClick={() => setIsPreviewModalOpen(true)}
                  disabled={selectedProducts.length === 0}
                  className={`px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center gap-2
                    ${selectedProducts.length > 0
                      ? 'bg-[#514FE4] hover:bg-[#4140B3] dark:bg-[#6C63FF] dark:hover:bg-[#5B54E8] text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  다운로드
                </button>
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 text-white 
                  text-sm rounded-lg p-2 shadow-lg">
                  이미지와 순위댓글 다운로드
                </div>
              </div>

              {/* 영상 내보내기 버튼 */}
              <div className="relative group">
                <button
                  onClick={() => {
                    // 선택된 상품 정보를 JSON 문자열로 변환하여 URL 파라미터로 전달
                    const productsParam = encodeURIComponent(JSON.stringify(selectedProducts));
                    router.push(`/video-creation?products=${productsParam}`);
                  }}
                  className="px-6 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center gap-2
                    bg-gradient-to-r from-purple-500 to-indigo-500 opacity-80
                    text-white/90 hover:opacity-100 hover:shadow-lg"
                >
                  {/* <LockClosedIcon className="w-4 h-4 animate-pulse" /> */}
                  영상 내보내기
                  {/* <span className="ml-1 text-xs px-2 py-0.5 bg-white/20 rounded-full">PRO</span> */}
                </button>
                {/* <div className="absolute bottom-full mb-2 hidden group-hover:block w-56 
                  bg-gradient-to-r from-purple-600 to-indigo-600 text-white
                  text-sm rounded-lg p-3 shadow-xl transform transition-all duration-200
                  border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <LockClosedIcon className="w-4 h-4" />
                    <span>프리미엄 기능입니다</span>
                  </div>
                  <p className="text-xs text-white/80 mt-1">
                    업그레이드하여 고품질 영상을 제작해보세요
                  </p>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 