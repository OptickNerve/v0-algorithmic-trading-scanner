import { type Candle, type Timeframe } from './types'

function getIntervalAndRange(timeframe: Timeframe): { interval: string; range: string } {
  switch (timeframe) {
    case '1m': return { interval: '1m', range: '1d' }
    case '5m': return { interval: '5m', range: '5d' }
    case '15m': return { interval: '15m', range: '5d' }
    case '1h': return { interval: '1h', range: '720h' }
    case '4h': return { interval: '1h', range: '720h' } 
    case '1d': return { interval: '1d', range: '12mo' }
    default: return { interval: '1h', range: '720h' }
  }
}

export async function fetchCandles(symbol: string, timeframe: Timeframe): Promise<Candle[]> {
  let ticker = symbol
  if (symbol === 'XAUUSD') ticker = 'GC=F'      
  else if (symbol === 'US30') ticker = '^DJI'    
  else if (symbol === 'NAS100') ticker = '^IXIC'  
  else if (symbol.endsWith('USD') && symbol !== 'BTCUSD') {
    const base = symbol.substring(0, 3)
    const quote = symbol.substring(3, 6)
    ticker = `${base}${quote}=X`
  } else if (symbol === 'BTCUSD') {
    ticker = 'BTC-USD'
  }

  const { interval, range } = getIntervalAndRange(timeframe)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`

  const response = await fetch(url, { next: { revalidate: 60 } })
  if (!response.ok) {
    throw new Error(`Market feed request rejected for ticker: ${ticker}`)
  }

  const data = await response.json()
  const result = data.chart?.result?.[0]
  if (!result) {
    throw new Error(`Data format error for ticker: ${ticker}`)
  }

  const timestamps = result.timestamp || []
  const indicators = result.indicators?.quote?.[0] || {}
  const { open = [], high = [], low = [], close = [], volume = [] } = indicators

  let candles: Candle[] = []

  for (let i = 0; i < timestamps.length; i++) {
    if (open[i] != null && high[i] != null && low[i] != null && close[i] != null) {
      candles.push({
        timestamp: timestamps[i] * 1000,
        open: open[i],
        high: high[i],
        low: low[i],
        close: close[i],
        volume: volume[i] || 0,
      })
    }
  }

  if (timeframe === '4h') {
    const aggregated: Candle[] = []
    for (let i = 0; i < candles.length; i += 4) {
      const chunk = candles.slice(i, i + 4)
      if (chunk.length === 0) continue
      aggregated.push({
        timestamp: chunk[0].timestamp,
        open: chunk[0].open,
        high: Math.max(...chunk.map(c => c.high)),
        low: Math.min(...chunk.map(c => c.low)),
        close: chunk[chunk.length - 1].close,
        volume: chunk.reduce((sum, c) => sum + c.volume, 0),
      })
    }
    candles = aggregated
  }

  return candles
}
