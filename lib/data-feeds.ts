import type { Candle, Timeframe } from './types'
import { getAssetBySymbol } from './types'

// Convert timeframe to Yahoo Finance interval
function getYahooInterval(timeframe: Timeframe): string {
  switch (timeframe) {
    case '1h': return '1h'
    case '4h': return '1h' // Yahoo doesn't support 4h, we'll aggregate
    case '1d': return '1d'
    default: return '1h'
  }
}

// Convert timeframe to Yahoo Finance range
function getYahooRange(timeframe: Timeframe): string {
  switch (timeframe) {
    case '1h': return '30d'
    case '4h': return '60d'
    case '1d': return '1y'
    default: return '30d'
  }
}

// Aggregate candles for 4h timeframe
function aggregateCandles(candles: Candle[], targetBars: number): Candle[] {
  if (targetBars <= 1) return candles
  
  const aggregated: Candle[] = []
  
  for (let i = 0; i < candles.length; i += targetBars) {
    const slice = candles.slice(i, i + targetBars)
    if (slice.length === 0) continue
    
    aggregated.push({
      timestamp: slice[0].timestamp,
      open: slice[0].open,
      high: Math.max(...slice.map(c => c.high)),
      low: Math.min(...slice.map(c => c.low)),
      close: slice[slice.length - 1].close,
      volume: slice.reduce((sum, c) => sum + (c.volume || 0), 0),
    })
  }
  
  return aggregated
}

// Fetch data from Yahoo Finance using yahoo-finance2
export async function fetchYahooCandles(
  yahooSymbol: string,
  timeframe: Timeframe
): Promise<Candle[]> {
  // Dynamic import to avoid issues with server-side
  const yahooFinance = (await import('yahoo-finance2')).default
  
  const interval = getYahooInterval(timeframe)
  const range = getYahooRange(timeframe)
  
  try {
    const result = await yahooFinance.chart(yahooSymbol, {
      period1: getStartDate(range),
      period2: new Date(),
      interval: interval as '1h' | '1d' | '1wk' | '1mo',
    })
    
    if (!result.quotes || result.quotes.length === 0) {
      throw new Error(`No data returned for ${yahooSymbol}`)
    }
    
    let candles: Candle[] = result.quotes
      .filter(q => q.open && q.high && q.low && q.close)
      .map(q => ({
        timestamp: new Date(q.date).getTime(),
        open: q.open!,
        high: q.high!,
        low: q.low!,
        close: q.close!,
        volume: q.volume,
      }))
    
    // Aggregate to 4h if needed
    if (timeframe === '4h') {
      candles = aggregateCandles(candles, 4)
    }
    
    return candles
  } catch (error) {
    console.error(`Yahoo Finance error for ${yahooSymbol}:`, error)
    throw error
  }
}

// Helper to get start date from range string
function getStartDate(range: string): Date {
  const now = new Date()
  const match = range.match(/^(\d+)([dwmy])$/)
  
  if (!match) return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const value = parseInt(match[1])
  const unit = match[2]
  
  switch (unit) {
    case 'd':
      return new Date(now.getTime() - value * 24 * 60 * 60 * 1000)
    case 'w':
      return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000)
    case 'm':
      return new Date(now.setMonth(now.getMonth() - value))
    case 'y':
      return new Date(now.setFullYear(now.getFullYear() - value))
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

// Coinbase granularity mapping
function getCoinbaseGranularity(timeframe: Timeframe): string {
  switch (timeframe) {
    case '1h': return 'ONE_HOUR'
    case '4h': return 'ONE_HOUR' // We'll aggregate
    case '1d': return 'ONE_DAY'
    default: return 'ONE_HOUR'
  }
}

// Fetch data from Coinbase public API
export async function fetchCoinbaseCandles(
  coinbaseSymbol: string,
  timeframe: Timeframe
): Promise<Candle[]> {
  const granularity = getCoinbaseGranularity(timeframe)
  
  // Calculate time range
  const now = Math.floor(Date.now() / 1000)
  const secondsPerCandle = timeframe === '1d' ? 86400 : 3600
  const candlesNeeded = timeframe === '4h' ? 300 * 4 : 300 // Need more for aggregation
  const start = now - (candlesNeeded * secondsPerCandle)
  
  const url = `https://api.coinbase.com/api/v3/brokerage/market/products/${coinbaseSymbol}/candles?granularity=${granularity}&start=${start}&end=${now}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Coinbase API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.candles || data.candles.length === 0) {
      throw new Error(`No data returned for ${coinbaseSymbol}`)
    }
    
    // Coinbase returns: { candles: [{ start, low, high, open, close, volume }] }
    let candles: Candle[] = data.candles
      .map((c: { start: string; open: string; high: string; low: string; close: string; volume: string }) => ({
        timestamp: parseInt(c.start) * 1000,
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: parseFloat(c.volume),
      }))
      .sort((a: Candle, b: Candle) => a.timestamp - b.timestamp)
    
    // Aggregate to 4h if needed
    if (timeframe === '4h') {
      candles = aggregateCandles(candles, 4)
    }
    
    return candles
  } catch (error) {
    console.error(`Coinbase error for ${coinbaseSymbol}:`, error)
    throw error
  }
}

// Main function to fetch candles for any asset
export async function fetchCandles(
  symbol: string,
  timeframe: Timeframe
): Promise<Candle[]> {
  const asset = getAssetBySymbol(symbol)
  
  if (!asset) {
    throw new Error(`Unknown asset: ${symbol}`)
  }
  
  // Use Coinbase for crypto
  if (asset.coinbaseSymbol) {
    return fetchCoinbaseCandles(asset.coinbaseSymbol, timeframe)
  }
  
  // Use Yahoo Finance for everything else
  if (asset.yahooSymbol) {
    return fetchYahooCandles(asset.yahooSymbol, timeframe)
  }
  
  throw new Error(`No data source configured for ${symbol}`)
}
