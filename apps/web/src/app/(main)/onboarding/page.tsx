import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Boas-vindas" };

export default async function OnboardingPage() {
  const { profile } = await requireUser({ requireOnboarding: false });
  if (profile?.age_confirmed_at) redirect("/app");
  return (
    <AuthShell title="Boas-vindas ao HoneyMoney" description="Só mais um passo antes de chamar os agentes.">
      <OnboardingForm defaultName={profile?.display_name ?? ""} />
    </AuthShell>
  );
}
