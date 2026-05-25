import { type Candle, type ScanResult, type Timeframe } from './types'

function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return new Array(prices.length).fill(0)
  const k = 2 / (period + 1)
  const ema: number[] = []
  let sum = 0
  for (let i = 0; i < period; i++) sum += prices[i]
  ema[period - 1] = sum / period

  for (let i = period; i < prices.length; i++) {
    ema[i] = prices[i] * k + ema[i - 1] * (1 - k)
  }
  return ema
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50
  let gains = 0, losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period
  }

  if (avgLoss === 0) return 100
  return 100 - 100 / (1 + (avgGain / avgLoss))
}

export function scanAsset(symbol: string, category: string, candles: Candle[], timeframe: Timeframe): ScanResult {
  const closes = candles.map(c => c.close)
  const latestPrice = closes[closes.length - 1]

  const ema50Array = calculateEMA(closes, 50)
  const ema200Array = calculateEMA(closes, 200)
  const ema50 = ema50Array[ema50Array.length - 1]
  const ema200 = ema200Array[ema200Array.length - 1]

  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
  if (ema50 > ema200 && latestPrice > ema50) trend = 'BULLISH'
  else if (ema50 < ema200 && latestPrice < ema50) trend = 'BEARISH'

  const rsi = calculateRSI(closes, 14)
  let signal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL'
  let confidence = 0

  if (trend === 'BULLISH' && rsi < 40) {
    signal = 'LONG'
    confidence = Math.floor(70 + (40 - rsi))
  } else if (trend === 'BEARISH' && rsi > 60) {
    signal = 'SHORT'
    confidence = Math.floor(70 + (rsi - 60))
  }

  return {
    symbol,
    category,
    currentPrice: latestPrice,
    signal,
    confidence: Math.min(confidence, 99),
    ema: { trend, value50: ema50, value200: ema200 },
    rsi: Math.round(rsi * 100) / 100,
    macd: { value: 0, signal: 0, histogram: 0 },
    timestamp: Date.now(),
  }
}
