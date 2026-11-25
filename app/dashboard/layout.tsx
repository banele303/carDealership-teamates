import { AutopulseShell } from "@/components/autopulse/autopulse-shell"
import { ConvexAuthGate } from "@/components/autopulse/convex-auth-gate"
import { AutopulseConvexProvider } from "@/components/autopulse/convex-provider"

export const metadata = {
  title: "AutoPulse Motors SA — Car Dealership AI & Multi-Portal Command Center",
  description:
    "South African New & Used Car Dealership Platform: Cars.co.za & AutoTrader SA Multi-Portal Publishing, SA Multi-Bank Finance Auto-Apply (WesBank, Absa, MFC, Standard Bank), Buyer Follow-Ups & AI Teammates.",
}

export default function AutopulseDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AutopulseConvexProvider>
      <ConvexAuthGate>
        <AutopulseShell>{children}</AutopulseShell>
      </ConvexAuthGate>
    </AutopulseConvexProvider>
  )
}
