export interface DeeplinkRequest {
    coupangUrls: string[];
}

export interface DeeplinkResponse {
    rCode: string;
    rMessage: string;
    data: {
        shortenUrl: string;
    }[];
}

export interface ErrorResponse {
    message: string;
    error?: Error | unknown;
} 