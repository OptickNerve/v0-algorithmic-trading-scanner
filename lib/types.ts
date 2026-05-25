export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export interface ScanResult {
  symbol: string
  category: string
  currentPrice: number
  signal: 'LONG' | 'SHORT' | 'NEUTRAL'
  confidence: number
  ema: { trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; value50: number; value200: number }
  rsi: number
  macd: { value: number; signal: number; histogram: number }
  timestamp: number
}

export const ASSET_MARKET_MAP = [
  { symbol: 'XAUUSD', category: 'metals' },
  { symbol: 'BTCUSD', category: 'crypto' },
  { symbol: 'AUDCAD', category: 'forex' },
  { symbol: 'AUDJPY', category: 'forex' },
  { symbol: 'US30', category: 'indices' },
  { symbol: 'NAS100', category: 'indices' }
]

export function getAssetBySymbol(symbol: string) {
  return ASSET_MARKET_MAP.find(a => a.symbol === symbol.toUpperCase())
}
