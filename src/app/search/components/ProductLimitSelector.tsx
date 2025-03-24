
type ProductLimitSelectorProps = {
    limit: number;
    setLimit: (limit: number) => void;
}

function ProductLimitSelector({ limit, setLimit }: ProductLimitSelectorProps) {
    return (
      <div className="flex gap-4 mb-8">
        {[3, 5, 10, 20].map((num) => (
          <button
            key={num}
            onClick={() => setLimit(num)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              limit === num
                ? 'bg-[#514FE4] text-white dark:bg-[#6C63FF]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {num}개
          </button>
        ))}
      </div>
    );
  }

export default ProductLimitSelector;