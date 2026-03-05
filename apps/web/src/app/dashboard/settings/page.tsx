import { getAiSettings } from '@/lib/actions/ai-settings';
import { AiSettingsForm } from './_components/ai-settings-form';
import { DangerZone } from './_components/danger-zone';
import {
  AccountSettings,
  SecuritySettings,
} from './_components/account-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const aiSettings = await getAiSettings();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, security, AI configuration, and data.
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="ai">AI &amp; Data</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6 space-y-6">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="ai" className="mt-6 space-y-6">
          <AiSettingsForm initialSettings={aiSettings} />
          <DangerZone />
        </TabsContent>
      </Tabs>
    </div>
  );
}
