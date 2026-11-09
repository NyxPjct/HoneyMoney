import type { Metadata } from "next";
import { AccountSection } from "./account-section";
import { AppShellSection } from "./app-shell-section";
import { KeysManager } from "./keys-manager";
import { ProfileSection } from "./profile-section";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      <KeysManager />
      <ProfileSection />
      <AccountSection />
      <AppShellSection />
    </div>
  );
}
