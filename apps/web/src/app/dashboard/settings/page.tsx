import { getAiSettings } from '@/lib/actions/ai-settings';
import { AiSettingsForm } from './_components/ai-settings-form';
import { DangerZone } from './_components/danger-zone';
import {
  AccountSettings,
  SecuritySettings,
} from './_components/account-settings';
import {
  getActiveModels,
  computePassCost,
  type OperationType,
} from '@/lib/config/ai-operations';
import { AppearanceSettings } from './_components/appearance-settings';
import { NotificationPreferences } from './_components/notification-preferences';
import { Sprout } from 'lucide-react';
import { SettingsShell } from './_components/settings-shell';

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
    <div className="flex flex-col gap-8 px-8 py-10 max-w-6xl">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Personalize your learning experience and manage your identity.
        </p>
      </header>

      <SettingsShell>
        {{
          account: (
            <>
              <AccountSettings />
              <NotificationPreferences />

              {/* Motivational quote */}
              <section className="bg-muted/40 rounded-[2rem] p-10 flex flex-col md:flex-row items-center gap-8 overflow-hidden shadow-md">
                <div className="flex-1">
                  <div className="text-primary/40 text-5xl mb-3">&ldquo;</div>
                  <p className="text-xl font-light italic leading-relaxed text-foreground">
                    &ldquo;The sanctuary of learning is where focus meets
                    intention. Your environment shapes your growth.&rdquo;
                  </p>
                  <p className="text-sm text-primary font-bold mt-4">
                    — Temar Guide
                  </p>
                </div>
                <div className="shrink-0 w-32 h-32 rounded-full bg-secondary flex items-center justify-center">
                  <Sprout className="w-14 h-14 text-secondary-foreground" />
                </div>
              </section>
            </>
          ),
          security: <SecuritySettings />,
          ai: (
            <>
              <AiSettingsForm
                initialSettings={aiSettings}
                modelConfigs={modelConfigs}
                passCosts={passCosts}
              />
              <DangerZone />
            </>
          ),
          appearance: <AppearanceSettings />,
        }}
      </SettingsShell>
    </div>
  );
}
