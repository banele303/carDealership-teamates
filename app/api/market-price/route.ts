import { NextRequest, NextResponse } from "next/server"
import { analyzeSaMarketPricing } from "@/lib/sa-dealership"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const year = Number(body.year) || 2024
    const make = String(body.make || "Toyota").trim()
    const model = String(body.model || "Hilux").trim()
    const variant = String(body.variant || "").trim()
    const mileageKm = Number(body.mileageKm) || 18000
    const priceZar = Number(body.priceZar) || 749900
    const fullServiceHistory = body.fullServiceHistory !== false

    const analysis = analyzeSaMarketPricing({
      year,
      make,
      model,
      variant,
      mileageKm,
      priceZar,
      fullServiceHistory,
    })

    const comparables = [
      {
        portal: "Cars.co.za",
        dealer: " Hatfield Motor Group (Gauteng)",
        title: `${year} ${make} ${model} ${variant}`.trim(),
        mileageKm: Math.max(2500, mileageKm - 3200),
        priceZar: analysis.marketHighZar - 100,
        daysListed: 27,
      },
      {
        portal: "AutoTrader SA",
        dealer: "CMH Certified Pre-Owned (Sandton)",
        title: `${year} ${make} ${model} ${variant}`.trim(),
        mileageKm: mileageKm + 1400,
        priceZar: analysis.marketAvgZar - 100,
        daysListed: 19,
      },
      {
        portal: "Cars.co.za",
        dealer: "CFAOMotors Mobility (Midrand)",
        title: `${year} ${make} ${model} ${variant}`.trim(),
        mileageKm: mileageKm + 6800,
        priceZar: analysis.marketLowZar + 4900,
        daysListed: 12,
      },
    ]

    return NextResponse.json({
      success: true,
      analysis,
      comparables,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze SA market pricing",
      },
      { status: 500 }
    )
  }
}
