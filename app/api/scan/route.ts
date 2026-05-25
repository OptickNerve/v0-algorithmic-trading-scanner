import { NextRequest, NextResponse } from 'next/server'
import { fetchCandles } from '@/lib/data-feeds'
import { scanAsset } from '@/lib/analysis'
import { getAssetBySymbol, type Timeframe, type ScanResult } from '@/lib/types'

export const maxDuration = 60 // Allow longer runtime for multiple assets

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbolsParam = searchParams.get('symbols')
  const timeframe = (searchParams.get('timeframe') || '4h') as Timeframe

  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Missing symbols parameter' },
      { status: 400 }
    )
  }

  const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean)
  
  if (symbols.length === 0) {
    return NextResponse.json(
      { error: 'No valid symbols provided' },
      { status: 400 }
    )
  }

  const results: ScanResult[] = []
  const errors: string[] = []

  // Process each symbol with isolated error handling
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const asset = getAssetBySymbol(symbol)
        if (!asset) {
          errors.push(`Unknown asset: ${symbol}`)
          return
        }

        const candles = await fetchCandles(symbol, timeframe)
        
        if (candles.length < 200) {
          errors.push(`Insufficient data for ${symbol}: ${candles.length} candles`)
          return
        }

        const result = scanAsset(symbol, asset.category, candles, timeframe)
        results.push(result)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${symbol}: ${message}`)
      }
    })
  )

  return NextResponse.json({
    results,
    errors,
    timestamp: Date.now(),
    timeframe,
    scannedCount: results.length,
    errorCount: errors.length,
  })
}
