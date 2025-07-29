const ApiSection = () => {
  return (
    <section id="api" className="py-20 bg-coupas-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-8 mb-10 md:mb-0 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-coupas-dark mb-6">
              쿠팡 파트너스 API 설정
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              쿠팡 파트너스 API를 쉽게 연동하고 상품 검색 기능을 바로 활용해보세요. 
              Access Key와 Secret Key를 한 번 설정하면 언제든지 쿠팡 상품을 검색하고 영상에 활용할 수 있습니다.
            </p>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 text-sm font-medium">Access Key</label>
                <div className="bg-gray-100 p-3 rounded border border-gray-300 text-gray-700">
                  028d1bc3-8dab-43a8-b855-b1f21797b4f0
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2 text-sm font-medium">Secret Key</label>
                <div className="bg-gray-100 p-3 rounded border border-gray-300 text-gray-700">
                  ••••••••••••••••••••••••••••••••••••••
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-coupas-dark">API 설정 화면</h3>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">Access Key 입력</div>
                    <div className="bg-white p-2 rounded border mt-1 text-sm">
                      028d1bc3-8dab-43a8-b855-*********
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">Secret Key 입력</div>
                    <div className="bg-white p-2 rounded border mt-1 text-sm">
                      ••••••••••••••••••••••••••••
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="px-4 py-2 bg-coupas-primary text-white rounded text-sm">
                      연동 완료
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApiSection;
