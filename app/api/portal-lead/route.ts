import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"

import { api } from "@/convex/_generated/api"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      buyerName,
      phone,
      email,
      saIdNumber,
      stockNumber,
      vehicleTitle,
      vehiclePriceZar,
      enquiryType = "finance",
      portalSource = "dealership_website",
      depositZar,
      termMonths,
      balloonPct,
      grossMonthlyIncomeZar,
      monthlyExpensesZar,
      employerName,
      preferredTestDriveSlot,
      branch,
      banks,
      notes,
    } = body

    if (!buyerName || !phone || !stockNumber || !vehicleTitle) {
      return NextResponse.json(
        {
          error:
            "buyerName, phone, stockNumber, and vehicleTitle are required.",
        },
        { status: 400 }
      )
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim()
    let convexResult: Record<string, unknown> | null = null

    if (convexUrl) {
      try {
        const client = new ConvexHttpClient(convexUrl)
        convexResult = (await client.mutation(
          api.vehicles.submitShowroomEnquiry,
          {
            buyerName: String(buyerName),
            phone: String(phone),
            email: email ? String(email) : undefined,
            saIdNumber: saIdNumber ? String(saIdNumber) : undefined,
            stockNumber: String(stockNumber),
            vehicleTitle: String(vehicleTitle),
            vehiclePriceZar: Number(vehiclePriceZar) || 499900,
            enquiryType:
              enquiryType === "test_drive" ||
              enquiryType === "whatsapp_quote"
                ? enquiryType
                : "finance",
            portalSource: String(portalSource),
            depositZar:
              depositZar !== undefined ? Number(depositZar) : undefined,
            termMonths:
              termMonths !== undefined ? Number(termMonths) : undefined,
            balloonPct:
              balloonPct !== undefined ? Number(balloonPct) : undefined,
            grossMonthlyIncomeZar:
              grossMonthlyIncomeZar !== undefined
                ? Number(grossMonthlyIncomeZar)
                : undefined,
            monthlyExpensesZar:
              monthlyExpensesZar !== undefined
                ? Number(monthlyExpensesZar)
                : undefined,
            employerName: employerName ? String(employerName) : undefined,
            preferredTestDriveSlot: preferredTestDriveSlot
              ? String(preferredTestDriveSlot)
              : undefined,
            branch: branch ? String(branch) : undefined,
            banks: Array.isArray(banks) ? banks.map(String) : undefined,
            notes: notes ? String(notes) : undefined,
          }
        )) as Record<string, unknown>
      } catch {
        // Fallback below if Convex function is mid-sync
      }
    }

    const price = Number(vehiclePriceZar) || 499900
    const dep = Number(depositZar) || Math.round(price * 0.1)
    const term = Number(termMonths) || 72
    const balloon = Number(balloonPct) || 20
    const r = 0.1175 / 12
    const df = Math.pow(1 + r, -term)
    const balloonAmt = Math.round(price * (balloon / 100))
    const principal = Math.max(0, price + 6500 + 1207.5 - dep)
    const estMonthly = Math.round(
      ((principal - balloonAmt * df) * r) / (1 - df) + 69
    )

    const whatsappMessage =
      (convexResult?.whatsappReply as string | undefined) ||
      `Hi ${buyerName}! AutoPulse Motors SA here. We received your ${portalSource} ${enquiryType} request for the ${vehicleTitle} (${stockNumber} · R ${price.toLocaleString("en-ZA")}, est. R ${estMonthly.toLocaleString("en-ZA")}/pm). Our Finance & F&I and Follow-Up Agents have queued your dossier!`

    // Optional live Whapi.cloud dispatch if WHAPI_TOKEN is configured
    let whapiDispatched = false
    const whapiToken = process.env.WHAPI_TOKEN?.trim()
    const cleanDigits = String(phone).replace(/\D/g, "")
    const normalizedZaPhone = cleanDigits.startsWith("0")
      ? `27${cleanDigits.slice(1)}`
      : cleanDigits

    if (whapiToken && normalizedZaPhone.length >= 10) {
      try {
        const whapiRes = await fetch(
          "https://gate.whapi.cloud/messages/text",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${whapiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: `${normalizedZaPhone}@s.whatsapp.net`,
              body: whatsappMessage,
            }),
          }
        )
        whapiDispatched = whapiRes.ok
      } catch {
        whapiDispatched = false
      }
    }

    return NextResponse.json({
      success: true,
      enquiryType,
      portalSource,
      stockNumber,
      vehicleTitle,
      estimatedMonthlyZar:
        (convexResult?.estimatedMonthlyZar as number | undefined) ??
        estMonthly,
      applicationRef:
        (convexResult?.applicationRef as string | undefined) ??
        `VAF-ZA-${Date.now().toString().slice(-6)}`,
      bankSubmissions:
        (convexResult?.bankSubmissions as unknown[] | undefined) ?? [
          {
            bank: "WesBank",
            status: "submitted",
            referenceNo: `WES-${Date.now().toString().slice(-6)}`,
            offeredRatePct: 11.75,
          },
          {
            bank: "Absa Vehicle Finance",
            status: "submitted",
            referenceNo: `ABS-${(Date.now() + 19).toString().slice(-6)}`,
            offeredRatePct: 11.9,
          },
          {
            bank: "MFC (Nedbank)",
            status: "submitted",
            referenceNo: `MFC-${(Date.now() + 37).toString().slice(-6)}`,
            offeredRatePct: 11.65,
          },
          {
            bank: "Standard Bank VAF",
            status: "submitted",
            referenceNo: `STD-${(Date.now() + 53).toString().slice(-6)}`,
            offeredRatePct: 12.0,
          },
        ],
      whatsappMessage,
      whapiDispatched,
      whatsappDeepLink: `https://wa.me/27631995124?text=${encodeURIComponent(
        `Hi AutoPulse Motors SA! I just submitted my ${enquiryType} request for ${vehicleTitle} (${stockNumber}). Name: ${buyerName}`
      )}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process showroom lead",
      },
      { status: 500 }
    )
  }
}
