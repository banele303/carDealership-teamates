import { NextRequest, NextResponse } from "next/server"
import {
  SA_SHOWROOM_VEHICLES,
  type PortalSlug,
} from "@/lib/sa-dealership"

export const dynamic = "force-dynamic"

const PORTAL_NAMES: Record<PortalSlug, string> = {
  cars_co_za: "Cars.co.za (DAP XML Feed)",
  autotrader_sa: "AutoTrader SA (DMS Feed)",
  dealership_website: "Own Website (/showroom)",
  facebook_marketplace: "Facebook Marketplace ZA",
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const cleanStock = String(
      body.stockNumber || `APM-${Date.now().toString().slice(-4)}`
    ).toUpperCase()

    const matchedVehicle = SA_SHOWROOM_VEHICLES.find(
      (v) => v.stockNumber.toUpperCase() === cleanStock
    )

    const year = body.year ?? matchedVehicle?.year ?? 2024
    const make = body.make ?? matchedVehicle?.make
    const model = body.model ?? matchedVehicle?.model
    const variant = body.variant ?? matchedVehicle?.variant ?? ""
    const priceZar = body.priceZar ?? matchedVehicle?.priceZar
    const mileageKm = body.mileageKm ?? matchedVehicle?.mileageKm ?? 0
    const vin = body.vin ?? matchedVehicle?.vin ?? "VERIFIED-ZA"
    const portals: PortalSlug[] = body.portals ?? [
      "cars_co_za",
      "autotrader_sa",
      "dealership_website",
    ]

    if (!make || !model || !priceZar) {
      return NextResponse.json(
        {
          error:
            "Vehicle make, model, and retail price (ZAR) or a valid stockNumber are required to publish.",
        },
        { status: 400 }
      )
    }

    const origin =
      req.nextUrl.origin || process.env.APP_URL || "http://localhost:3000"
    const now = new Date().toISOString()

    const results = portals.map((portal) => {
      const listingId =
        portal === "cars_co_za"
          ? `CARS-DAP-${cleanStock}`
          : portal === "autotrader_sa"
            ? `AT-ZA-${cleanStock}`
            : portal === "facebook_marketplace"
              ? `META-AIA-${cleanStock}`
              : `WEB-${cleanStock}`

      const feedUrl =
        portal === "cars_co_za"
          ? `${origin}/api/feeds/vehicles?portal=cars_co_za`
          : portal === "autotrader_sa"
            ? `${origin}/api/feeds/vehicles?portal=autotrader_sa`
            : `${origin}/showroom?stock=${encodeURIComponent(cleanStock)}`

      return {
        portal,
        portalName: PORTAL_NAMES[portal] ?? portal,
        status: "published",
        listingId,
        externalRef: listingId,
        feedUrl,
        externalUrl: feedUrl,
        publishedAt: now,
      }
    })

    return NextResponse.json({
      success: true,
      stockNumber: cleanStock,
      vin,
      headline: `${year} ${make} ${model} ${variant}`.trim(),
      priceZar: Number(priceZar),
      mileageKm: Number(mileageKm),
      vehicle: {
        stockNumber: cleanStock,
        vin,
        year,
        make,
        model,
        variant,
        priceZar: Number(priceZar),
        mileageKm: Number(mileageKm),
      },
      portalsPublished: results,
      listings: results,
      showroomUrl: `${origin}/showroom?stock=${encodeURIComponent(cleanStock)}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Multi-portal syndication failed",
      },
      { status: 500 }
    )
  }
}
