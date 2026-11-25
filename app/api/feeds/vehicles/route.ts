import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"

import { api } from "@/convex/_generated/api"
import { SA_SHOWROOM_VEHICLES, type ShowroomVehicle } from "@/lib/sa-dealership"

export const dynamic = "force-dynamic"

function escapeXml(value: string | number | boolean | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

async function loadShowroomVehicles(): Promise<ShowroomVehicle[]> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim()
  if (convexUrl) {
    try {
      const client = new ConvexHttpClient(convexUrl)
      const rows = (await client.query(api.vehicles.listPublicShowroom, {})) as ShowroomVehicle[]
      if (Array.isArray(rows) && rows.length > 0) {
        return rows
      }
    } catch {
      // Fallback cleanly to default SA showroom catalog
    }
  }
  return SA_SHOWROOM_VEHICLES
}

function buildCarsCoZaXml(vehicles: ShowroomVehicle[], origin: string): string {
  const items = vehicles
    .filter((v) => v.portals.cars_co_za && v.status !== "sold")
    .map(
      (v) => `  <Vehicle>
    <DealerStockCode>${escapeXml(v.stockNumber)}</DealerStockCode>
    <VIN>${escapeXml(v.vin)}</VIN>
    <Condition>${v.condition === "new" ? "New" : v.condition === "demo" ? "Demo" : "Used"}</Condition>
    <Year>${v.year}</Year>
    <Make>${escapeXml(v.make)}</Make>
    <Model>${escapeXml(v.model)}</Model>
    <Variant>${escapeXml(v.variant)}</Variant>
    <BodyType>${escapeXml(v.bodyType)}</BodyType>
    <MileageKm>${v.mileageKm}</MileageKm>
    <Transmission>${escapeXml(v.transmission)}</Transmission>
    <FuelType>${escapeXml(v.fuelType)}</FuelType>
    <Colour>${escapeXml(v.colour)}</Colour>
    <PriceZAR>${v.retailPriceZar}</PriceZAR>
    <Currency>ZAR</Currency>
    <FullServiceHistory>${v.fullServiceHistory ? "Yes" : "No"}</FullServiceHistory>
    <SpareKeys>${v.spareKeys ? "Yes" : "No"}</SpareKeys>
    <DEKRAGrade>${escapeXml(v.dekraGrade)}</DEKRAGrade>
    <Branch>${escapeXml(v.branch)}</Branch>
    <Country>ZA</Country>
    <Description>${escapeXml(v.description)}</Description>
    <Extras>${escapeXml(v.features.join(" | "))}</Extras>
    <WebsiteUrl>${escapeXml(`${origin}/showroom?stock=${v.stockNumber}`)}</WebsiteUrl>
    <Images>
      <ImageUrl>${escapeXml(v.imageUrl || `${origin}/logo.svg`)}</ImageUrl>
    </Images>
  </Vehicle>`
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<CarsCoZaDealerFeed version="2.0" market="ZA" currency="ZAR" generatedAt="${new Date().toISOString()}">
  <Dealer>
    <Name>AutoPulse Motors South Africa (Pty) Ltd</Name>
    <DealerCode>APM-ZA-001</DealerCode>
    <Country>South Africa</Country>
  </Dealer>
  <Vehicles count="${vehicles.filter((v) => v.portals.cars_co_za && v.status !== "sold").length}">
${items}
  </Vehicles>
</CarsCoZaDealerFeed>`
}

function buildAutoTraderSaXml(vehicles: ShowroomVehicle[], origin: string): string {
  const items = vehicles
    .filter((v) => v.portals.autotrader_sa && v.status !== "sold")
    .map(
      (v) => `  <Advert>
    <StockNo>${escapeXml(v.stockNumber)}</StockNo>
    <VinNumber>${escapeXml(v.vin)}</VinNumber>
    <Category>${v.condition === "new" ? "New" : "Used"}</Category>
    <RegistrationYear>${v.year}</RegistrationYear>
    <Make>${escapeXml(v.make)}</Make>
    <Model>${escapeXml(v.model)}</Model>
    <Derivative>${escapeXml(v.variant)}</Derivative>
    <BodyStyle>${escapeXml(v.bodyType)}</BodyStyle>
    <OdometerKm>${v.mileageKm}</OdometerKm>
    <Gearbox>${escapeXml(v.transmission)}</Gearbox>
    <Fuel>${escapeXml(v.fuelType)}</Fuel>
    <ExteriorColour>${escapeXml(v.colour)}</ExteriorColour>
    <RetailPriceInclVat>${v.retailPriceZar}</RetailPriceInclVat>
    <VatIncluded>true</VatIncluded>
    <DealerLocation>${escapeXml(v.branch)}</DealerLocation>
    <SellerComments>${escapeXml(v.description)}</SellerComments>
    <Features>${v.features.map((f) => `<Feature>${escapeXml(f)}</Feature>`).join("")}</Features>
    <ShowroomUrl>${escapeXml(`${origin}/showroom?stock=${v.stockNumber}`)}</ShowroomUrl>
    <Media><Photo>${escapeXml(v.imageUrl || `${origin}/logo.svg`)}</Photo></Media>
  </Advert>`
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<AutoTraderSouthAfricaFeed schema="AT-ZA-DMS-4.1" generatedAt="${new Date().toISOString()}">
  <DealerAccount id="AT-APM-ZA-001" name="AutoPulse Motors South Africa" region="Gauteng / Nationwide" />
  <StockList>
${items}
  </StockList>
</AutoTraderSouthAfricaFeed>`
}

export async function GET(req: NextRequest) {
  const portal = (req.nextUrl.searchParams.get("portal") || "website").toLowerCase()
  const origin = req.nextUrl.origin || process.env.APP_URL || "http://localhost:3000"
  const vehicles = await loadShowroomVehicles()

  if (portal === "cars_co_za" || portal === "cars") {
    return new NextResponse(buildCarsCoZaXml(vehicles, origin), {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  }

  if (portal === "autotrader_sa" || portal === "autotrader") {
    return new NextResponse(buildAutoTraderSaXml(vehicles, origin), {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  }

  const published = vehicles.filter(
    (v) => v.portals.dealership_website && v.status !== "sold"
  )
  return NextResponse.json({
    dealership: "AutoPulse Motors South Africa (Pty) Ltd",
    currency: "ZAR",
    country: "ZA",
    generatedAt: new Date().toISOString(),
    feeds: {
      cars_co_za_xml: `${origin}/api/feeds/vehicles?portal=cars_co_za`,
      autotrader_sa_xml: `${origin}/api/feeds/vehicles?portal=autotrader_sa`,
      website_json: `${origin}/api/feeds/vehicles?portal=website`,
      live_showroom: `${origin}/showroom`,
    },
    count: published.length,
    vehicles: published,
  })
}
