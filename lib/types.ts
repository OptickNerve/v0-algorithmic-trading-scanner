// Asset categories and symbols
export type AssetCategory = 'forex' | 'metals' | 'crypto' | 'indices'

export interface Asset {
  symbol: string
  name: string
  category: AssetCategory
  enabled: boolean
  yahooSymbol?: string
  coinbaseSymbol?: string
}

// OHLC candle data
export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// Technical analysis signals
export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL'

export interface EMAAnalysis {
  ema50: number
  ema200: number
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
}

export interface StructurePoint {
  type: 'HIGH' | 'LOW'
  price: number
  index: number
  timestamp: number
}

export interface BosAnalysis {
  hasBreak: boolean
  direction: 'BULLISH' | 'BEARISH' | null
  breakPrice: number | null
  structurePoints: StructurePoint[]
}

export interface FibLevel {
  level: number
  price: number
  label: string
}

export interface FibAnalysis {
  levels: FibLevel[]
  inZone: boolean
  zoneStart: number // 50%
  zoneEnd: number // 78.6%
  swingHigh: number
  swingLow: number
}

export interface ReversalCandle {
  type: 'BULLISH_ENGULFING' | 'BEARISH_ENGULFING' | 'HAMMER' | 'SHOOTING_STAR' | 'DOJI' | null
  index: number
}

export interface ScanResult {
  symbol: string
  category: AssetCategory
  timestamp: number
  timeframe: string
  currentPrice: number
  ema: EMAAnalysis
  bos: BosAnalysis
  fib: FibAnalysis
  reversalCandle: ReversalCandle
  signal: SignalDirection
  confidence: number // 0-100
  entryPrice: number | null
  stopLoss: number | null
  takeProfit: number | null
  riskRewardRatio: number | null
}

// Trade journal types
export interface TradeEntry {
  id: string
  entryPrice: number
  lots: number
  timestamp: number
}

export interface Trade {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  entries: TradeEntry[]
  exitPrice: number | null
  exitTimestamp: number | null
  stopLoss: number
  takeProfit: number
  status: 'OPEN' | 'CLOSED' | 'PENDING'
  outcome: 'WIN' | 'LOSS' | null
  notes: string
  screenshot?: string
  createdAt: number
  updatedAt: number
  // Calculated fields
  vwapEntry: number
  totalLots: number
  pnlZAR: number | null
}

// Backtest types
export interface BacktestConfig {
  startDate: number
  endDate: number
  initialCapital: number
  riskPerTrade: number // percentage
  assets: string[]
  timeframes: string[]
}

export interface BacktestTrade {
  symbol: string
  direction: SignalDirection
  entryPrice: number
  exitPrice: number
  entryTime: number
  exitTime: number
  pnl: number
  outcome: 'WIN' | 'LOSS'
}

export interface BacktestResult {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  profitFactor: number
  maxDrawdown: number
  netProfit: number
  trades: BacktestTrade[]
}

// Analytics types
export interface TradeStats {
  totalTrades: number
  winRate: number
  profitFactor: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  totalPnlZAR: number
}

export interface AssetPerformance {
  symbol: string
  trades: number
  winRate: number
  pnlZAR: number
}

// Signal tracker (pending signals from scanner)
export interface PendingSignal {
  id: string
  scanResult: ScanResult
  createdAt: number
  status: 'PENDING' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED'
  outcome: 'WIN' | 'LOSS' | null
  triggeredAt: number | null
  resolvedAt: number | null
}

// WhatsApp alert
export interface WhatsAppAlert {
  id: string
  signal: ScanResult
  sentAt: number
  phoneNumber: string
  status: 'SENT' | 'FAILED'
}

// Scanner settings
export interface ScannerSettings {
  enabledAssets: Record<string, boolean>
  timeframes: string[]
  autoRefreshInterval: number // seconds
  whatsappEnabled: boolean
  whatsappNumber: string
}

// Default assets configuration
export const FOREX_PAIRS: Asset[] = [
  // Majors
  { symbol: 'EURUSD', name: 'Euro/US Dollar', category: 'forex', enabled: true, yahooSymbol: 'EURUSD=X' },
  { symbol: 'GBPUSD', name: 'British Pound/US Dollar', category: 'forex', enabled: true, yahooSymbol: 'GBPUSD=X' },
  { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen', category: 'forex', enabled: true, yahooSymbol: 'USDJPY=X' },
  { symbol: 'USDCHF', name: 'US Dollar/Swiss Franc', category: 'forex', enabled: true, yahooSymbol: 'USDCHF=X' },
  { symbol: 'AUDUSD', name: 'Australian Dollar/US Dollar', category: 'forex', enabled: true, yahooSymbol: 'AUDUSD=X' },
  { symbol: 'USDCAD', name: 'US Dollar/Canadian Dollar', category: 'forex', enabled: true, yahooSymbol: 'USDCAD=X' },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar/US Dollar', category: 'forex', enabled: true, yahooSymbol: 'NZDUSD=X' },
  // Crosses - EUR
  { symbol: 'EURGBP', name: 'Euro/British Pound', category: 'forex', enabled: true, yahooSymbol: 'EURGBP=X' },
  { symbol: 'EURJPY', name: 'Euro/Japanese Yen', category: 'forex', enabled: true, yahooSymbol: 'EURJPY=X' },
  { symbol: 'EURCHF', name: 'Euro/Swiss Franc', category: 'forex', enabled: true, yahooSymbol: 'EURCHF=X' },
  { symbol: 'EURAUD', name: 'Euro/Australian Dollar', category: 'forex', enabled: true, yahooSymbol: 'EURAUD=X' },
  { symbol: 'EURCAD', name: 'Euro/Canadian Dollar', category: 'forex', enabled: true, yahooSymbol: 'EURCAD=X' },
  { symbol: 'EURNZD', name: 'Euro/New Zealand Dollar', category: 'forex', enabled: true, yahooSymbol: 'EURNZD=X' },
  // Crosses - GBP
  { symbol: 'GBPJPY', name: 'British Pound/Japanese Yen', category: 'forex', enabled: true, yahooSymbol: 'GBPJPY=X' },
  { symbol: 'GBPCHF', name: 'British Pound/Swiss Franc', category: 'forex', enabled: true, yahooSymbol: 'GBPCHF=X' },
  { symbol: 'GBPAUD', name: 'British Pound/Australian Dollar', category: 'forex', enabled: true, yahooSymbol: 'GBPAUD=X' },
  { symbol: 'GBPCAD', name: 'British Pound/Canadian Dollar', category: 'forex', enabled: true, yahooSymbol: 'GBPCAD=X' },
  { symbol: 'GBPNZD', name: 'British Pound/New Zealand Dollar', category: 'forex', enabled: true, yahooSymbol: 'GBPNZD=X' },
  // Crosses - AUD
  { symbol: 'AUDJPY', name: 'Australian Dollar/Japanese Yen', category: 'forex', enabled: true, yahooSymbol: 'AUDJPY=X' },
  { symbol: 'AUDCHF', name: 'Australian Dollar/Swiss Franc', category: 'forex', enabled: true, yahooSymbol: 'AUDCHF=X' },
  { symbol: 'AUDCAD', name: 'Australian Dollar/Canadian Dollar', category: 'forex', enabled: true, yahooSymbol: 'AUDCAD=X' },
  { symbol: 'AUDNZD', name: 'Australian Dollar/New Zealand Dollar', category: 'forex', enabled: true, yahooSymbol: 'AUDNZD=X' },
  // Crosses - CAD
  { symbol: 'CADJPY', name: 'Canadian Dollar/Japanese Yen', category: 'forex', enabled: true, yahooSymbol: 'CADJPY=X' },
  { symbol: 'CADCHF', name: 'Canadian Dollar/Swiss Franc', category: 'forex', enabled: true, yahooSymbol: 'CADCHF=X' },
  // Crosses - CHF
  { symbol: 'CHFJPY', name: 'Swiss Franc/Japanese Yen', category: 'forex', enabled: true, yahooSymbol: 'CHFJPY=X' },
  // Crosses - NZD
  { symbol: 'NZDJPY', name: 'New Zealand Dollar/Japanese Yen', category: 'forex', enabled: true, yahooSymbol: 'NZDJPY=X' },
  { symbol: 'NZDCHF', name: 'New Zealand Dollar/Swiss Franc', category: 'forex', enabled: true, yahooSymbol: 'NZDCHF=X' },
  { symbol: 'NZDCAD', name: 'New Zealand Dollar/Canadian Dollar', category: 'forex', enabled: true, yahooSymbol: 'NZDCAD=X' },
]

export const METALS: Asset[] = [
  { symbol: 'XAUUSD', name: 'Gold/US Dollar', category: 'metals', enabled: true, yahooSymbol: 'GC=F' },
  { symbol: 'XAGUSD', name: 'Silver/US Dollar', category: 'metals', enabled: true, yahooSymbol: 'SI=F' },
]

export const CRYPTO: Asset[] = [
  { symbol: 'BTCUSD', name: 'Bitcoin/US Dollar', category: 'crypto', enabled: true, coinbaseSymbol: 'BTC-USD' },
]

export const INDICES: Asset[] = [
  { symbol: 'US30', name: 'Dow Jones Industrial Average', category: 'indices', enabled: true, yahooSymbol: 'YM=F' },
  { symbol: 'NAS100', name: 'NASDAQ 100', category: 'indices', enabled: true, yahooSymbol: 'NQ=F' },
]

export const ALL_ASSETS: Asset[] = [...FOREX_PAIRS, ...METALS, ...CRYPTO, ...INDICES]

export const TIMEFRAMES = ['1h', '4h', '1d'] as const
export type Timeframe = typeof TIMEFRAMES[number]

// Helper to get asset by symbol
export function getAssetBySymbol(symbol: string): Asset | undefined {
  return ALL_ASSETS.find(a => a.symbol === symbol)
}
