import { getAiSettings } from '@/lib/actions/ai-settings';
import { AiSettingsForm } from './_components/ai-settings-form';
import { DangerZone } from './_components/danger-zone';
import {
  AccountSettings,
  SecuritySettings,
} from './_components/account-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getActiveModels,
  computePassCost,
  type OperationType,
} from '@/lib/config/ai-operations';
import { AppearanceSettings } from './_components/appearance-settings';
import { NotificationPreferences } from './_components/notification-preferences';
import { User, Shield, BrainCircuit, Palette, Coins, Sprout } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ALL_OPS: OperationType[] = [
  'question_generation',
  'answer_analysis',
  'chunk_enhancement',
  'content_generation',
];

export default async function SettingsPage() {
  const aiSettings = await getAiSettings();
  const modelConfigs = await getActiveModels();

  // Pre-compute pass costs for every model × operation
  const passCosts: Record<string, Record<string, number>> = {};
  for (const m of modelConfigs) {
    passCosts[m.modelId] = {};
    for (const op of ALL_OPS) {
      passCosts[m.modelId][op] = await computePassCost(m.modelId, op);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize your learning experience and manage your identity.
        </p>
      </div>

      <Tabs defaultValue="account" orientation="vertical" className="flex gap-6">
        {/* Vertical sidebar tabs */}
        <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1 w-[180px] shrink-0">
          <TabsTrigger
            value="account"
            className="justify-start gap-2 px-3 py-2 text-sm rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none w-full"
          >
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="justify-start gap-2 px-3 py-2 text-sm rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none w-full"
          >
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="justify-start gap-2 px-3 py-2 text-sm rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none w-full"
          >
            <BrainCircuit className="w-4 h-4" />
            AI & Data
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="justify-start gap-2 px-3 py-2 text-sm rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none w-full"
          >
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:bg-muted transition-colors w-full"
          >
            <Coins className="w-4 h-4" />
            Billing
          </Link>
        </TabsList>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          <TabsContent value="account" className="mt-0 space-y-6">
            <AccountSettings />
            <NotificationPreferences />

            {/* Motivational quote */}
            <div className="rounded-2xl bg-accent/30 p-6 flex items-start gap-4">
              <div className="flex-1">
                <div className="text-primary text-2xl mb-2">&ldquo;&ldquo;</div>
                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  &ldquo;The sanctuary of learning is where focus meets
                  intention. Your environment shapes your growth.&rdquo;
                </p>
                <p className="text-xs text-primary font-semibold mt-2">
                  — Temar Guide
                </p>
              </div>
              <div className="shrink-0 w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                <Sprout className="w-8 h-8 text-secondary-foreground" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-0 space-y-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="ai" className="mt-0 space-y-6">
            <AiSettingsForm
              initialSettings={aiSettings}
              modelConfigs={modelConfigs}
              passCosts={passCosts}
            />
            <DangerZone />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 space-y-6">
            <AppearanceSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
