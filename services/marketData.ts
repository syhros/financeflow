import { MarketData } from '../types';

// API key is now safely stored in environment variables
const API_KEY = import.meta.env.VITE_MARKET_DATA_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Global flag to ensure the warning is logged only once
let hasWarnedAboutApiKey = false;

// Cache for market data to reduce API calls
const marketDataCache = new Map<string, { data: MarketData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const fetchMarketData = async (tickers: string[]): Promise<MarketData> => {
    if (tickers.length === 0) return {};

    // Check cache first
    const cacheKey = tickers.sort().join(',');
    const cached = marketDataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    // Check for missing API key
    if (!API_KEY) {
        // Only log the warning if we haven't already
        if (!hasWarnedAboutApiKey) {
            console.warn('API key for Financial Modeling Prep is not set. Using mock data.');
            hasWarnedAboutApiKey = true;
        }

        // Return mock data if API key is not set
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

    // API Fetching Logic with retry
    const uniqueTickers = [...new Set(tickers)];
    const url = `${BASE_URL}/quote/${uniqueTickers.join(',')}?apikey=${API_KEY}`;

    let retries = 3;
    while (retries > 0) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error('Invalid API response format');
            }

            const marketData: MarketData = {};
            data.forEach((item: any) => {
                if (item?.symbol && typeof item.price === 'number') {
                    marketData[item.symbol] = {
                        price: item.price,
                        name: item.name || item.symbol,
                    };
                }
            });

            // Cache successful response
            marketDataCache.set(cacheKey, { data: marketData, timestamp: Date.now() });
            return marketData;
        } catch (error) {
            retries--;
            console.error(`Error fetching market data (${retries} retries left):`, error);
            if (retries === 0) {
                // Fallback to empty object after all retries
                return {};
            }
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 1000));
        }
    }

    return {};
};