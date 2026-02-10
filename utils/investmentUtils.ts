import { Transaction, Holding } from '../types';

export interface HoldingMetrics {
  currentPrice: number;
  isEstimated: boolean;
  unrealizedPL: number;
  realizedPL: number;
  totalPL: number;
  totalPLPercent: number;
}

export function getLatestTransactionPrice(ticker: string, transactions: Transaction[]): number | null {
  const relevantTransactions = transactions
    .filter(tx => tx.ticker === ticker && (tx.action === 'buy' || tx.action === 'sell'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (relevantTransactions.length === 0) return null;

  const latestTx = relevantTransactions[0];
  let pricePerShare = latestTx.pricePerShare || (latestTx.total && latestTx.shares ? latestTx.total / Math.abs(latestTx.shares) : null);

  if (!pricePerShare) return null;

  // Convert GBX to GBP by dividing by 100
  const currencyPrice = latestTx.currencyPrice || 'GBP';
  if (currencyPrice === 'GBX') {
    pricePerShare = pricePerShare / 100;
  }

  // Apply exchange rate conversion if needed
  if (latestTx.exchangeRate) {
    pricePerShare = pricePerShare * latestTx.exchangeRate;
  }

  return pricePerShare;
}

export function calculateHoldingMetrics(
  holding: Holding,
  currentMarketPrice: number | undefined,
  ticker: string,
  transactions: Transaction[]
): HoldingMetrics {
  // Determine current price with fallback logic
  let currentPrice = currentMarketPrice;
  let isEstimated = false;

  if (!currentMarketPrice) {
    if (holding.currentPrice) {
      currentPrice = holding.currentPrice;
    } else {
      const fallbackPrice = getLatestTransactionPrice(ticker, transactions);
      if (fallbackPrice) {
        currentPrice = fallbackPrice;
        isEstimated = true;
      } else {
        currentPrice = holding.avgCost;
        isEstimated = true;
      }
    }
  }

  // Sort transactions chronologically (oldest first)
  const tickerTransactions = transactions
    .filter(tx => tx.ticker === ticker)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Track running weighted average cost basis and shares
  let runningAvgCost = 0;
  let runningShares = 0;
  let realizedPL = 0;
  let totalDividends = 0;

  tickerTransactions.forEach(tx => {
    if (tx.action === 'dividend') {
      // Track dividends separately
      totalDividends += tx.amount || tx.total || 0;
    } else if (tx.action === 'buy' && tx.shares) {
      // Calculate price per share in GBP
      let pricePerShare = tx.pricePerShare || (tx.total! / Math.abs(tx.shares));
      const exchangeRate = tx.exchangeRate || 1;
      pricePerShare = pricePerShare * exchangeRate;

      const sharesBought = Math.abs(tx.shares);

      // Update weighted average cost
      if (runningShares > 0) {
        const totalCost = (runningAvgCost * runningShares) + (pricePerShare * sharesBought);
        runningShares += sharesBought;
        runningAvgCost = totalCost / runningShares;
      } else {
        runningShares = sharesBought;
        runningAvgCost = pricePerShare;
      }
    } else if (tx.action === 'sell' && tx.shares) {
      // Calculate realized P/L for this sell
      let sellPricePerShare = tx.pricePerShare || (tx.total! / Math.abs(tx.shares));
      const exchangeRate = tx.exchangeRate || 1;
      sellPricePerShare = sellPricePerShare * exchangeRate;

      const sharesSold = Math.abs(tx.shares);

      // Calculate realized gain/loss
      const sellProceeds = sharesSold * sellPricePerShare;
      const sellCost = sharesSold * runningAvgCost;
      realizedPL += (sellProceeds - sellCost);

      // Reduce running shares (avg cost stays the same)
      runningShares -= sharesSold;
    }
  });

  // Calculate unrealized P/L on remaining shares
  const unrealizedPL = (currentPrice * holding.shares) - (holding.avgCost * holding.shares);

  // Total P/L includes realized gains/losses, unrealized gains/losses, and dividends
  const totalPL = realizedPL + unrealizedPL + totalDividends;

  // Calculate percentage
  const totalInvested = holding.avgCost * holding.shares;
  const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return {
    currentPrice,
    isEstimated,
    unrealizedPL,
    realizedPL: realizedPL + totalDividends,
    totalPL,
    totalPLPercent
  };
}
