import { NextRequest, NextResponse } from "next/server"
import {
  calculateSaVehicleFinance,
  parseSouthAfricanId,
  SA_BANKS,
  type SaBankName,
} from "@/lib/sa-dealership"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      applicantName,
      saIdNumber = "",
      phone = "",
      email = "",
      vehicleTitle,
      vehiclePriceZar,
      depositZar = 0,
      tradeInEquityZar = 0,
      balloonPct = 0,
      interestRatePct = 11.75,
      termMonths = 72,
      grossMonthlyIncomeZar = 0,
      monthlyExpensesZar = 0,
      banks = ["WesBank", "Absa Vehicle Finance", "MFC (Nedbank)", "Standard Bank VAF"] as SaBankName[],
    } = body

    if (!applicantName || !vehiclePriceZar) {
      return NextResponse.json(
        { error: "Applicant name and vehicle price (ZAR) are required." },
        { status: 400 }
      )
    }

    const idInfo = saIdNumber ? parseSouthAfricanId(String(saIdNumber)) : null
    const calc = calculateSaVehicleFinance({
      vehiclePriceZar: Number(vehiclePriceZar),
      depositZar: Number(depositZar),
      tradeInEquityZar: Number(tradeInEquityZar),
      balloonPct: Number(balloonPct),
      interestRatePct: Number(interestRatePct),
      termMonths: Number(termMonths),
      grossMonthlyIncomeZar: Number(grossMonthlyIncomeZar) || undefined,
      monthlyExpensesZar: Number(monthlyExpensesZar) || undefined,
    })

    const now = Date.now()
    const applicationRef = `VAF-ZA-${String(now).slice(-6)}`
    const bankDispatches = (banks as string[]).map((bankName, idx) => {
      const meta = SA_BANKS.find((b) => b.name === bankName)
      return {
        bank: bankName,
        dealerDeskEmail: meta?.email ?? "fi-submissions@signio.co.za",
        referenceNo: `${bankName.replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase()}-${String(now + idx * 19).slice(-6)}`,
        status: "submitted",
        estimatedTurnaround: meta?.turnaround ?? "30 min",
        indicatedRatePct: Math.round((calc.interestRatePct + (meta?.typicalRateOffset ?? 0.35) - 0.35) * 100) / 100,
      }
    })

    return NextResponse.json({
      success: true,
      applicationRef,
      applicantName,
      phone,
      email,
      vehicleTitle: vehicleTitle || "Showroom Vehicle",
      saIdValidation: idInfo,
      calculation: calc,
      signioBundleReady: true,
      bankDispatches,
      submittedAt: new Date(now).toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Finance submission failed" },
      { status: 500 }
    )
  }
}
