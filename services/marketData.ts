import { MarketData } from '../types';

// API key is now safely stored in environment variables
const API_KEY = import.meta.env.VITE_MARKET_DATA_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/stable';

// Global flag to ensure the warning is logged only once
let hasWarnedAboutApiKey = false;

// Cache for market data to reduce API calls
const marketDataCache = new Map<string, { data: MarketData; timestamp: number }>();
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour
let lastApiCallTime = 0;
const API_CALL_COOLDOWN = 1 * 60 * 60 * 1000; // 1 hour

export const clearMarketDataCache = () => {
    marketDataCache.clear();
    lastApiCallTime = 0;
};

export const fetchMarketData = async (tickers: string[]): Promise<MarketData> => {
    if (tickers.length === 0) return {};

    // Check cache first
    const cacheKey = tickers.sort().join(',');
    const cached = marketDataCache.get(cacheKey);

    // If we have cached data and it's within the API cooldown period, return it
    const timeSinceLastCall = Date.now() - lastApiCallTime;
    if (cached && timeSinceLastCall < API_CALL_COOLDOWN) {
        return cached.data;
    }

    // Check for missing API key
    if (!API_KEY) {
        // Only log the warning if we haven't already
        if (!hasWarnedAboutApiKey) {
            console.warn('API key for Financial Modeling Prep is not set. Using mock data.');
            hasWarnedAboutApiKey = true;
        }

        // Return cached data if available, otherwise return mock data
        if (cached) {
            return cached.data;
        }

        // Generate mock data if no cache
        const mockData: MarketData = {};
        tickers.forEach((ticker) => {
            const upper = ticker.toUpperCase();
            if (upper === 'AAPL') {
                mockData[ticker] = { price: 175.0, name: 'Apple Inc.' };
            } else if (upper === 'TSLA') {
                mockData[ticker] = { price: 180.0, name: 'Tesla, Inc.' };
            } else if (upper === 'BTC-USD') {
                mockData[ticker] = { price: 65000.0, name: 'Bitcoin' };
            } else {
                mockData[ticker] = { price: Math.random() * 500, name: `${ticker} Name` };
            }
        });

        // Cache mock data
        marketDataCache.set(cacheKey, { data: mockData, timestamp: Date.now() });
        return mockData;
    }

    // Check if we're still within the cooldown period
    if (timeSinceLastCall < API_CALL_COOLDOWN) {
        // Return cached data if available, otherwise empty object
        if (cached) {
            return cached.data;
        }
        return {};
    }

    // API Fetching Logic with retry
    const uniqueTickers = [...new Set(tickers)];
    const marketData: MarketData = {};

    let retries = 3;
    let successCount = 0;

    for (const ticker of uniqueTickers) {
        retries = 3;
        while (retries > 0) {
            try {
                const url = `${BASE_URL}/profile?symbol=${ticker}&apikey=${API_KEY}`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                const data = await response.json();

                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error('Invalid API response format');
                }

                const item = data[0];
                if (item?.symbol && typeof item.price === 'number') {
                    marketData[item.symbol] = {
                        price: item.price,
                        name: item.companyName || item.name || item.symbol,
                    };
                    successCount++;
                }
                break;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    console.error(`Failed to fetch market data for ${ticker}:`, error);
                } else {
                    console.warn(`Retrying ${ticker} (${retries} retries left):`, error);
                    await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 500));
                }
            }
        }
    }

    if (successCount > 0) {
        lastApiCallTime = Date.now();
        marketDataCache.set(cacheKey, { data: marketData, timestamp: Date.now() });
    }

    return marketData;
};