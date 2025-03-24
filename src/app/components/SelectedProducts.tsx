import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Image from 'next/image';
import { ProductData } from '../types';

interface SelectedProductsProps {
  products: ProductData[];
  onProductsChange: (products: ProductData[]) => void;
}

export default function SelectedProducts({ products, onProductsChange }: SelectedProductsProps) {
  const handleDelete = (indexToDelete: number) => {
    onProductsChange(products.filter((_, index) => index !== indexToDelete));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(products);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onProductsChange(items);
  };

  if (products.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        선택된 상품 목록
        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
          드래그하여 순위 변경
        </span>
      </h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="products" direction="horizontal">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3"
            >
              {products.map((product, index) => (
                <Draggable 
                  key={product.productId.toString()} 
                  draggableId={product.productId.toString()} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`relative bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden w-full max-w-[100px] group
                        ${snapshot.isDragging ? 'shadow-lg ring-2 ring-[#514FE4] dark:ring-[#6C63FF]' : ''}`}
                      style={{
                        ...provided.draggableProps.style,
                      }}
                    >
                      <button
                        onClick={() => handleDelete(index)}
                        className="absolute -top-1 -right-1 z-30 w-6 h-6 bg-red-500 text-white rounded-full 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center
                          hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute -top-2 -left-2 z-20 w-8 h-8 bg-[#514FE4] dark:bg-[#6C63FF] rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div 
                        className={`relative aspect-square bg-white dark:bg-gray-800 ${
                          snapshot.isDragging ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                      >
                        <Image
                          src={product.productImage}
                          alt={product.productName}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-gray-800 dark:text-gray-100 line-clamp-1 mb-0.5 text-[10px]">
                          {product.productName}
                        </h3>
                        <p className="text-[#514FE4] dark:text-[#6C63FF] font-semibold text-[11px]">
                          {product.productPrice.toLocaleString()}원
                        </p>
                        <div className="flex items-center gap-0.5 text-[9px] text-gray-600 dark:text-gray-400">
                          <div className="flex items-center text-yellow-400">
                            {'★'.repeat(Math.floor(product.rating))}
                          </div>
                          <span>({product.reviewCount.toLocaleString()})</span>
                        </div>
                        {(product.isRocket || product.isFreeShipping) && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {product.isRocket && (
                              <span className="inline-flex items-center px-1 rounded text-[8px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                로켓
                              </span>
                            )}
                            {product.isFreeShipping && (
                              <span className="inline-flex items-center px-1 rounded text-[8px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                무료
                              </span>
                            )}
                          </div>
                        )}
                      </div>
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
  );
} 