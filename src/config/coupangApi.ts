interface CoupangApiConfig {
    REQUEST_METHOD: string;
    DOMAIN: string;
    URL: string;
}

export const COUPANG_API_CONFIG: CoupangApiConfig = {
    REQUEST_METHOD: "POST",
    DOMAIN: "https://api-gateway.coupang.com",
    URL: "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink",
}; 