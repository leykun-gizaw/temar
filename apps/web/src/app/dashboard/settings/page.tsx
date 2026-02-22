import { getAiSettings } from '@/lib/actions/ai-settings';
import { AiSettingsForm } from './_components/ai-settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const aiSettings = await getAiSettings();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your AI model preferences and API keys.
        </p>
      </div>
      <AiSettingsForm initialSettings={aiSettings} />
    </div>
  );
}
