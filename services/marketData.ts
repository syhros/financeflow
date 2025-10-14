import { MarketData } from '../types';

// IMPORTANT: Replace with your actual free API key from Financial Modeling Prep
const API_KEY = 'YOUR_API_KEY'; 
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// **NEW:** Global flag to ensure the warning is logged only once.
let hasWarnedAboutApiKey = false;

export const fetchMarketData = async (tickers: string[]): Promise<MarketData> => {
    
    // Check for missing API key
    if (API_KEY === 'YOUR_API_KEY' || !API_KEY) {
        
        // Only log the warning if we haven't already
        if (!hasWarnedAboutApiKey) {
            console.warn("API key for Financial Modeling Prep is not set. Using mock data.");
            hasWarnedAboutApiKey = true; // Set the flag after the first warning
        }

        // Return mock data if API key is not set
        const mockData: MarketData = {};
        tickers.forEach(ticker => {
            if (ticker.toUpperCase() === 'AAPL') {
                mockData[ticker] = { price: 175.00, name: 'Apple Inc.' };
            } else if (ticker.toUpperCase() === 'TSLA') {
                mockData[ticker] = { price: 180.00, name: 'Tesla, Inc.' };
            } else if (ticker.toUpperCase() === 'BTC-USD') {
                 mockData[ticker] = { price: 65000.00, name: 'Bitcoin' };
            } else {
                 mockData[ticker] = { price: Math.random() * 500, name: `${ticker} Name` };
            }
        });
        return mockData;
    }

    // --- API Fetching Logic (Only runs if API_KEY is set) ---
    const uniqueTickers = [...new Set(tickers)];
    const url = `${BASE_URL}/quote/${uniqueTickers.join(',')}?apikey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        
        const marketData: MarketData = {};
        data.forEach((item: any) => {
            marketData[item.symbol] = {
                price: item.price,
                name: item.name
            };
        });

        return marketData;
    } catch (error) {
        console.error("Error fetching market data:", error);
        // Fallback to mock data in case of an API error
        return {};
    }
};