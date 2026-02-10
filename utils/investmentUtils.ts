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
  return latestTx.pricePerShare || (latestTx.total && latestTx.shares ? latestTx.total / latestTx.shares : null);
}

export function calculateHoldingMetrics(
  holding: Holding,
  currentMarketPrice: number | undefined,
  ticker: string,
  transactions: Transaction[]
): HoldingMetrics {
  let currentPrice = currentMarketPrice || holding.currentPrice || holding.avgCost;
  let isEstimated = false;

  if (!currentMarketPrice && !holding.currentPrice) {
    const fallbackPrice = getLatestTransactionPrice(ticker, transactions);
    if (fallbackPrice) {
      currentPrice = fallbackPrice;
      isEstimated = true;
    }
  }

  const unrealizedPL = (currentPrice * holding.shares) - (holding.avgCost * holding.shares);

  const tickerTransactions = transactions.filter(tx => tx.ticker === ticker);
  let realizedPL = 0;
  let totalCostBasis = 0;
  let totalSharesSold = 0;

  tickerTransactions.forEach(tx => {
    if (tx.action === 'buy' && tx.shares) {
      totalCostBasis += (tx.pricePerShare || (tx.total / tx.shares)) * tx.shares;
    } else if (tx.action === 'sell' && tx.shares) {
      const soldSharesCount = Math.abs(tx.shares);
      const costPerShare = totalCostBasis / (Math.abs(
        tickerTransactions
          .filter(t => t.action === 'buy' && t.shares)
          .reduce((sum, t) => sum + t.shares!, 0)
      ) || 1);

      realizedPL += (soldSharesCount * (tx.pricePerShare || (tx.total / Math.abs(tx.shares)))) -
                    (soldSharesCount * costPerShare);
      totalSharesSold += soldSharesCount;
    }
  });

  const totalPL = unrealizedPL + realizedPL;
  const totalInvested = holding.avgCost * holding.shares + realizedPL;
  const totalPLPercent = totalInvested > 0 ? (totalPL / Math.abs(totalInvested)) * 100 : 0;

  return {
    currentPrice,
    isEstimated,
    unrealizedPL,
    realizedPL,
    totalPL,
    totalPLPercent
  };
}
