const Footer = () => {
  return (
    <footer className="bg-coupas-dark text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center mb-4">

              <h3 className="text-xl font-bold">Growsome</h3>
            </div>
            <p className="text-gray-300 max-w-xs">
              쿠팡 파트너스를 위한 최고의 영상 자동화 도구, 쿠파스
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 디어라운드 주식회사. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <a 
              href="https://www.threads.com/@coupas_do" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="sr-only">Threads</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.042 1.5 8.27 2.35 5.417 4.125 3.368 5.974 1.064 8.727-.116 12.308-.14h.007c3.581.024 6.334 1.205 8.184 3.509 1.645 2.05 2.495 4.904 2.495 8.448 0 3.772-.85 6.625-2.625 8.674-1.849 2.304-4.602 3.484-8.183 3.508zm0-21.24c-2.97.019-5.236.942-6.74 2.744C4.04 7.161 3.24 9.62 3.24 12.042c0 2.422.8 4.881 2.207 6.538 1.504 1.802 3.77 2.725 6.74 2.744 2.97-.019 5.236-.942 6.74-2.744 1.407-1.657 2.207-4.116 2.207-6.538 0-2.422-.8-4.881-2.207-6.538-1.504-1.802-3.77-2.725-6.74-2.744z"/>
                <path d="M17.99 8.999c-.79-.009-1.83-.013-2.56.075-.63.076-1.19.193-1.75.344-.6.162-1.17.349-1.77.344-.79-.007-1.44-.344-2.23-.344-.79 0-1.44.337-2.23.344-.6-.005-1.17-.182-1.77-.344-.56-.151-1.12-.268-1.75-.344-.73-.088-1.77-.084-2.56-.075-.4.005-.4.644 0 .65.79-.009 1.83-.013 2.56.075.63.076 1.19.193 1.75.344.6.162 1.17.349 1.77.344.79-.007 1.44-.344 2.23-.344.79 0 1.44.337 2.23.344.6-.005 1.17-.182 1.77-.344.56-.151 1.12-.268 1.75-.344.73-.088 1.77-.084 2.56-.075.4.005.4-.645 0-.65z"/>
              </svg>
            </a>
            <a 
              href="https://www.youtube.com/@growsome-ai" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="sr-only">YouTube</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
