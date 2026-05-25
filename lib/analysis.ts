import type { Candle, EMAAnalysis, BosAnalysis, FibAnalysis, ReversalCandle, ScanResult, StructurePoint, SignalDirection, AssetCategory } from './types'

// Calculate EMA
function calculateEMA(candles: Candle[], period: number): number[] {
  const ema: number[] = []
  const multiplier = 2 / (period + 1)

  // Start with SMA for first value
  let sum = 0
  for (let i = 0; i < period && i < candles.length; i++) {
    sum += candles[i].close
  }
  ema[period - 1] = sum / period

  // Calculate EMA for remaining values
  for (let i = period; i < candles.length; i++) {
    ema[i] = (candles[i].close - ema[i - 1]) * multiplier + ema[i - 1]
  }

  return ema
}

// EMA Analysis (50/200)
export function analyzeEMA(candles: Candle[]): EMAAnalysis {
  if (candles.length < 200) {
    return { ema50: 0, ema200: 0, trend: 'NEUTRAL' }
  }

  const ema50 = calculateEMA(candles, 50)
  const ema200 = calculateEMA(candles, 200)

  const currentEma50 = ema50[ema50.length - 1]
  const currentEma200 = ema200[ema200.length - 1]
  const currentPrice = candles[candles.length - 1].close

  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'

  // Bullish: Price > EMA50 > EMA200
  if (currentPrice > currentEma50 && currentEma50 > currentEma200) {
    trend = 'BULLISH'
  }
  // Bearish: Price < EMA50 < EMA200
  else if (currentPrice < currentEma50 && currentEma50 < currentEma200) {
    trend = 'BEARISH'
  }

  return {
    ema50: currentEma50,
    ema200: currentEma200,
    trend,
  }
}

// Find swing highs and lows for structure analysis
function findStructurePoints(candles: Candle[], lookback: number = 100): StructurePoint[] {
  const points: StructurePoint[] = []
  const relevantCandles = candles.slice(-lookback)

  for (let i = 2; i < relevantCandles.length - 2; i++) {
    const current = relevantCandles[i]
    const prev1 = relevantCandles[i - 1]
    const prev2 = relevantCandles[i - 2]
    const next1 = relevantCandles[i + 1]
    const next2 = relevantCandles[i + 2]

    // Swing High: Current high is higher than surrounding candles
    if (
      current.high > prev1.high &&
      current.high > prev2.high &&
      current.high > next1.high &&
      current.high > next2.high
    ) {
      points.push({
        type: 'HIGH',
        price: current.high,
        index: candles.length - lookback + i,
        timestamp: current.timestamp,
      })
    }

    // Swing Low: Current low is lower than surrounding candles
    if (
      current.low < prev1.low &&
      current.low < prev2.low &&
      current.low < next1.low &&
      current.low < next2.low
    ) {
      points.push({
        type: 'LOW',
        price: current.low,
        index: candles.length - lookback + i,
        timestamp: current.timestamp,
      })
    }
  }

  return points
}

// Break of Structure Analysis
export function analyzeBOS(candles: Candle[], lookback: number = 100): BosAnalysis {
  const structurePoints = findStructurePoints(candles, lookback)

  if (structurePoints.length < 3) {
    return {
      hasBreak: false,
      direction: null,
      breakPrice: null,
      structurePoints,
    }
  }

  const currentPrice = candles[candles.length - 1].close

  // Get recent highs and lows
  const recentHighs = structurePoints.filter(p => p.type === 'HIGH').slice(-3)
  const recentLows = structurePoints.filter(p => p.type === 'LOW').slice(-3)

  // Check for bullish BOS (price breaks above recent swing high)
  if (recentHighs.length >= 2) {
    const lastHigh = recentHighs[recentHighs.length - 1]
    const prevHigh = recentHighs[recentHighs.length - 2]
    if (currentPrice > lastHigh.price && lastHigh.price > prevHigh.price) {
      return {
        hasBreak: true,
        direction: 'BULLISH',
        breakPrice: lastHigh.price,
        structurePoints,
      }
    }
  }

  // Check for bearish BOS (price breaks below recent swing low)
  if (recentLows.length >= 2) {
    const lastLow = recentLows[recentLows.length - 1]
    const prevLow = recentLows[recentLows.length - 2]
    if (currentPrice < lastLow.price && lastLow.price < prevLow.price) {
      return {
        hasBreak: true,
        direction: 'BEARISH',
        breakPrice: lastLow.price,
        structurePoints,
      }
    }
  }

  return {
    hasBreak: false,
    direction: null,
    breakPrice: null,
    structurePoints,
  }
}

// Fibonacci Retracement Analysis
export function analyzeFibonacci(candles: Candle[], lookback: number = 50): FibAnalysis {
  const relevantCandles = candles.slice(-lookback)

  let swingHigh = -Infinity
  let swingLow = Infinity

  for (const candle of relevantCandles) {
    if (candle.high > swingHigh) swingHigh = candle.high
    if (candle.low < swingLow) swingLow = candle.low
  }

  const range = swingHigh - swingLow
  const currentPrice = candles[candles.length - 1].close

  // Fibonacci levels
  const levels = [
    { level: 0, price: swingHigh, label: '0%' },
    { level: 0.236, price: swingHigh - range * 0.236, label: '23.6%' },
    { level: 0.382, price: swingHigh - range * 0.382, label: '38.2%' },
    { level: 0.5, price: swingHigh - range * 0.5, label: '50%' },
    { level: 0.618, price: swingHigh - range * 0.618, label: '61.8%' },
    { level: 0.786, price: swingHigh - range * 0.786, label: '78.6%' },
    { level: 1, price: swingLow, label: '100%' },
  ]

  // Check if price is in the 50-78.6% zone
  const zoneStart = swingHigh - range * 0.5
  const zoneEnd = swingHigh - range * 0.786
  const inZone = currentPrice <= zoneStart && currentPrice >= zoneEnd

  return {
    levels,
    inZone,
    zoneStart,
    zoneEnd,
    swingHigh,
    swingLow,
  }
}

// Reversal Candle Detection
export function detectReversalCandle(candles: Candle[]): ReversalCandle {
  if (candles.length < 3) {
    return { type: null, index: -1 }
  }

  const current = candles[candles.length - 1]
  const previous = candles[candles.length - 2]

  const currentBody = Math.abs(current.close - current.open)
  const previousBody = Math.abs(previous.close - previous.open)
  const currentRange = current.high - current.low
  const currentUpperWick = current.high - Math.max(current.open, current.close)
  const currentLowerWick = Math.min(current.open, current.close) - current.low

  // Bullish Engulfing
  if (
    previous.close < previous.open && // Previous was bearish
    current.close > current.open && // Current is bullish
    current.open < previous.close && // Current opens below previous close
    current.close > previous.open // Current closes above previous open
  ) {
    return { type: 'BULLISH_ENGULFING', index: candles.length - 1 }
  }

  // Bearish Engulfing
  if (
    previous.close > previous.open && // Previous was bullish
    current.close < current.open && // Current is bearish
    current.open > previous.close && // Current opens above previous close
    current.close < previous.open // Current closes below previous open
  ) {
    return { type: 'BEARISH_ENGULFING', index: candles.length - 1 }
  }

  // Hammer (bullish reversal) - small body at top, long lower wick
  if (
    currentLowerWick >= currentBody * 2 &&
    currentUpperWick < currentBody * 0.5 &&
    current.close > current.open
  ) {
    return { type: 'HAMMER', index: candles.length - 1 }
  }

  // Shooting Star (bearish reversal) - small body at bottom, long upper wick
  if (
    currentUpperWick >= currentBody * 2 &&
    currentLowerWick < currentBody * 0.5 &&
    current.close < current.open
  ) {
    return { type: 'SHOOTING_STAR', index: candles.length - 1 }
  }

  // Doji - very small body relative to range
  if (currentBody < currentRange * 0.1 && currentRange > 0) {
    return { type: 'DOJI', index: candles.length - 1 }
  }

  return { type: null, index: -1 }
}

// Calculate entry, stop loss, and take profit
function calculateLevels(
  candles: Candle[],
  direction: SignalDirection,
  fib: FibAnalysis
): { entryPrice: number; stopLoss: number; takeProfit: number; riskRewardRatio: number } | null {
  if (direction === 'NEUTRAL') return null

  const currentPrice = candles[candles.length - 1].close
  const atr = calculateATR(candles, 14)

  if (direction === 'LONG') {
    const entryPrice = currentPrice
    const stopLoss = Math.min(fib.zoneEnd - atr * 0.5, currentPrice - atr * 1.5)
    const risk = entryPrice - stopLoss
    const takeProfit = entryPrice + risk * 2 // 1:2 R:R minimum

    return {
      entryPrice,
      stopLoss,
      takeProfit,
      riskRewardRatio: (takeProfit - entryPrice) / (entryPrice - stopLoss),
    }
  } else {
    const entryPrice = currentPrice
    const stopLoss = Math.max(fib.zoneStart + atr * 0.5, currentPrice + atr * 1.5)
    const risk = stopLoss - entryPrice
    const takeProfit = entryPrice - risk * 2 // 1:2 R:R minimum

    return {
      entryPrice,
      stopLoss,
      takeProfit,
      riskRewardRatio: (entryPrice - takeProfit) / (stopLoss - entryPrice),
    }
  }
}

// Calculate ATR
function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 0

  const trueRanges: number[] = []

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i]
    const previous = candles[i - 1]

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    )
    trueRanges.push(tr)
  }

  // Simple average of last 'period' true ranges
  const recentTRs = trueRanges.slice(-period)
  return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length
}

// Calculate confidence score
function calculateConfidence(
  ema: EMAAnalysis,
  bos: BosAnalysis,
  fib: FibAnalysis,
  reversal: ReversalCandle
): number {
  let confidence = 0

  // EMA alignment (30 points)
  if (ema.trend !== 'NEUTRAL') confidence += 30

  // Break of Structure (30 points)
  if (bos.hasBreak) confidence += 30

  // Fibonacci zone (20 points)
  if (fib.inZone) confidence += 20

  // Reversal candle (20 points)
  if (reversal.type) confidence += 20

  return confidence
}

// Main scan function
export function scanAsset(
  symbol: string,
  category: AssetCategory,
  candles: Candle[],
  timeframe: string
): ScanResult {
  const currentPrice = candles[candles.length - 1]?.close || 0
  const timestamp = Date.now()

  // Perform analysis
  const ema = analyzeEMA(candles)
  const bos = analyzeBOS(candles)
  const fib = analyzeFibonacci(candles)
  const reversalCandle = detectReversalCandle(candles)

  // Determine signal direction
  let signal: SignalDirection = 'NEUTRAL'

  // Long signal: Bullish EMA + Bullish BOS + In Fib zone + Bullish reversal
  if (
    ema.trend === 'BULLISH' &&
    bos.direction === 'BULLISH' &&
    fib.inZone &&
    (reversalCandle.type === 'BULLISH_ENGULFING' || reversalCandle.type === 'HAMMER')
  ) {
    signal = 'LONG'
  }

  // Short signal: Bearish EMA + Bearish BOS + In Fib zone + Bearish reversal
  if (
    ema.trend === 'BEARISH' &&
    bos.direction === 'BEARISH' &&
    fib.inZone &&
    (reversalCandle.type === 'BEARISH_ENGULFING' || reversalCandle.type === 'SHOOTING_STAR')
  ) {
    signal = 'SHORT'
  }

  // Calculate confidence
  const confidence = calculateConfidence(ema, bos, fib, reversalCandle)

  // Calculate levels
  const levels = calculateLevels(candles, signal, fib)

  return {
    symbol,
    category,
    timestamp,
    timeframe,
    currentPrice,
    ema,
    bos,
    fib,
    reversalCandle,
    signal,
    confidence,
    entryPrice: levels?.entryPrice || null,
    stopLoss: levels?.stopLoss || null,
    takeProfit: levels?.takeProfit || null,
    riskRewardRatio: levels?.riskRewardRatio || null,
  }
}
