'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Key, Sparkles, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { AiSettings, AiProvider } from '@/lib/actions/ai-settings';
import { saveAiSettings, clearAiApiKey } from '@/lib/actions/ai-settings';

const PROVIDERS: { value: AiProvider; label: string; description: string }[] = [
  {
    value: 'google',
    label: 'Google Gemini',
    description: 'Gemini 2.0 Flash, Pro, etc.',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o, GPT-4o Mini, etc.',
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    description: 'Claude Sonnet, Haiku, etc.',
  },
];

const MODEL_OPTIONS: Record<AiProvider, string[]> = {
  google: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414'],
};

export function AiSettingsForm({
  initialSettings,
}: {
  initialSettings: AiSettings;
}) {
  const [provider, setProvider] = useState<AiProvider | ''>(
    initialSettings.provider ?? ''
  );
  const [model, setModel] = useState(initialSettings.model ?? '');
  const [apiKey, setApiKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(
    initialSettings.hasApiKey
  );
  const [isPending, startTransition] = useTransition();

  const handleProviderChange = (value: string) => {
    if (value === 'system') {
      setProvider('');
      setModel('');
      return;
    }
    const p = value as AiProvider;
    setProvider(p);
    setModel(MODEL_OPTIONS[p]?.[0] ?? '');
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveAiSettings(
        provider || null,
        model || null,
        apiKey || undefined
      );
      if (result.success) {
        toast.success('AI settings saved');
        if (apiKey) {
          setHasExistingKey(true);
          setApiKey('');
        }
      } else {
        toast.error(result.error ?? 'Failed to save');
      }
    });
  };

  const handleClearKey = () => {
    startTransition(async () => {
      const result = await clearAiApiKey();
      if (result.success) {
        toast.success('API key removed');
        setHasExistingKey(false);
        setApiKey('');
      } else {
        toast.error(result.error ?? 'Failed to clear key');
      }
    });
  };

  const handleUseDefault = () => {
    startTransition(async () => {
      const result = await saveAiSettings(null, null, '');
      if (result.success) {
        toast.success('Switched to system default');
        setProvider('');
        setModel('');
        setApiKey('');
        setHasExistingKey(false);
      } else {
        toast.error(result.error ?? 'Failed to reset');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Model Configuration
        </CardTitle>
        <CardDescription>
          Choose your preferred AI provider and model for question generation.
          If left as system default, the platform&apos;s built-in model will be
          used.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <Select
            value={provider || 'system'}
            onValueChange={handleProviderChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">
                System Default
              </SelectItem>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <div className="flex flex-col">
                    <span>{p.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {provider && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS[provider]?.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can also type a custom model ID if it&apos;s not listed.
              </p>
              <Input
                placeholder="Or enter a custom model ID..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                API Key
              </label>
              {hasExistingKey && !apiKey && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-green-500" />
                  <span>API key is saved and encrypted</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearKey}
                    disabled={isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              )}
              <Input
                type="password"
                placeholder={
                  hasExistingKey
                    ? 'Enter new key to replace existing...'
                    : 'Enter your API key...'
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Your API key is encrypted at rest using AES-256-GCM.
              </p>
            </div>
          </>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
          {(provider || hasExistingKey) && (
            <Button
              variant="outline"
              onClick={handleUseDefault}
              disabled={isPending}
            >
              Use System Default
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
