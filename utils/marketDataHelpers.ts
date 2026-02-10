import { Asset, MarketData } from '../types';
import { fetchMarketData as fetchMarketDataApi } from '../services/marketData';

export const fetchMarketDataWithLondonSuffix = async (assets: Asset[]): Promise<MarketData> => {
    const tickerMap: Record<string, boolean> = {};
    const tickers: string[] = [];

    assets.forEach(asset => {
        if (asset.type === 'Investing' && asset.holdings) {
            asset.holdings.forEach(h => {
                if (!tickerMap.hasOwnProperty(h.ticker) && Math.abs(h.shares) > 0.1) {
                    tickerMap[h.ticker] = h.isLondonListed || false;
                    tickers.push(h.ticker);
                }
            });
        }
    });

    if (tickers.length === 0) return {};

    return fetchAndMapMarketData(tickers, tickerMap);
};

export const fetchAndMapMarketData = async (tickers: string[], tickerMap: Record<string, boolean>): Promise<MarketData> => {
    const apiTickers = tickers.map(t => tickerMap[t] ? `${t}.L` : t);
    const fetchedData = await fetchMarketDataApi(apiTickers);

    const mapped: MarketData = {};
    tickers.forEach((ticker, i) => {
        const apiTicker = apiTickers[i];
        if (fetchedData[apiTicker]) {
            mapped[ticker] = fetchedData[apiTicker];
        }
    });

    return mapped;
};

export const getTickerToLondonFlagMap = (assets: Asset[]): Record<string, boolean> => {
    const tickerMap: Record<string, boolean> = {};
    assets.forEach(asset => {
        if (asset.holdings) {
            asset.holdings.forEach(h => {
                tickerMap[h.ticker] = h.isLondonListed || false;
            });
        }
    });
    return tickerMap;
};

export const getMarketPriceForTicker = (ticker: string, isLondonListed: boolean, marketData: MarketData): number | undefined => {
    const apiTicker = isLondonListed ? `${ticker}.L` : ticker;
    return marketData[apiTicker]?.price || marketData[ticker]?.price;
};
