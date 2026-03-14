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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Key,
  Sparkles,
  Trash2,
  Shield,
  Coins,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AiSettings, AiProvider } from '@/lib/actions/ai-settings';
import {
  MODEL_CONFIGS,
  OPERATION_CONFIGS,
  getPassCost,
  DEFAULT_MODEL_ID,
  type OperationType,
} from '@/lib/config/ai-operations';
import {
  saveAiSettings,
  clearAiApiKey,
  saveMaxQuestionReviews,
} from '@/lib/actions/ai-settings';

const PROVIDERS: { value: AiProvider; label: string; description: string }[] = [
  {
    value: 'google',
    label: 'Google Gemini',
    description: 'Gemini 3 Flash, 2.5 Pro, etc.',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'GPT-4.1, o4-mini, etc.',
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    description: 'Claude Sonnet 4, Haiku 4, etc.',
  },
];

export function AiSettingsForm({
  initialSettings,
}: {
  initialSettings: AiSettings;
}) {
  const defaultModel = MODEL_CONFIGS.find(
    (m) => m.modelId === DEFAULT_MODEL_ID
  );
  const [provider, setProvider] = useState<AiProvider>(
    initialSettings.provider ?? defaultModel?.provider ?? 'google'
  );
  const [model, setModel] = useState(initialSettings.model ?? DEFAULT_MODEL_ID);
  const [apiKey, setApiKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(
    initialSettings.hasApiKey
  );
  const [useByok, setUseByok] = useState(initialSettings.useByok);
  const [maxReviews, setMaxReviews] = useState(
    initialSettings.maxQuestionReviews
  );
  const [isPending, startTransition] = useTransition();

  const providerModels = MODEL_CONFIGS.filter((m) => m.provider === provider);
  const effectiveModel = model || DEFAULT_MODEL_ID;
  const isByokActive = useByok && (hasExistingKey || !!apiKey);

  const CURRENT_OPS: OperationType[] = [
    'question_generation',
    'answer_analysis',
  ];
  const FUTURE_OPS: OperationType[] = [
    'chunk_enhancement',
    'content_generation',
  ];

  const handleProviderChange = (value: string) => {
    const p = value as AiProvider;
    setProvider(p);
    const firstModel = MODEL_CONFIGS.find((m) => m.provider === p);
    setModel(firstModel?.modelId ?? '');
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveAiSettings(
        provider,
        model || null,
        apiKey || undefined,
        useByok
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
        setUseByok(false);
      } else {
        toast.error(result.error ?? 'Failed to clear key');
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Model Configuration
          </CardTitle>
          <CardDescription>
            Choose your preferred AI provider and model for question generation
            and answer analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {providerModels.map((m) => (
                  <SelectItem key={m.modelId} value={m.modelId}>
                    {m.label}
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

          {/* BYOK toggle + API key */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  Bring Your Own Key (BYOK)
                </label>
                <p className="text-xs text-muted-foreground">
                  Use your own API key instead of purchased passes.
                </p>
              </div>
              <Switch
                checked={useByok}
                onCheckedChange={setUseByok}
                disabled={!hasExistingKey && !apiKey}
              />
            </div>

            <div className="space-y-2">
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
          </div>

          {/* Pass cost preview */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Pass Cost Preview</span>
            </div>
            {isByokActive ? (
              <div className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  BYOK active — current AI features (question generation &amp;
                  answer analysis) are <strong>free</strong> with your own API
                  key.
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                {CURRENT_OPS.map((op) => {
                  const cfg = OPERATION_CONFIGS[op];
                  const cost = getPassCost(op, effectiveModel);
                  return (
                    <div key={op} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{cfg.label}</span>
                      <span className="font-medium tabular-nums">
                        {cost} Pass
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-2 mt-2">
                  {FUTURE_OPS.map((op) => {
                    const cfg = OPERATION_CONFIGS[op];
                    const cost = getPassCost(op, effectiveModel);
                    return (
                      <div
                        key={op}
                        className="flex justify-between text-sm opacity-50"
                      >
                        <span className="text-muted-foreground">
                          {cfg.label} (coming soon)
                        </span>
                        <span className="font-medium tabular-nums">
                          {cost} Pass
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!isByokActive && (
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {hasExistingKey
                  ? 'BYOK is toggled off — using your Pass balance. Toggle on above to use your API key instead.'
                  : 'No API key set — uses your Pass balance. Add a key and enable BYOK for free access.'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Question Rotation
          </CardTitle>
          <CardDescription>
            After a question has been reviewed this many times, it will be
            retired and you&apos;ll be notified to regenerate fresh questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Max reviews per question
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              step={1}
              value={maxReviews}
              onChange={(e) =>
                setMaxReviews(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Questions will be retired after {maxReviews} review
              {maxReviews !== 1 ? 's' : ''}. Default is 5.
            </p>
          </div>
          <Button
            onClick={() => {
              startTransition(async () => {
                const result = await saveMaxQuestionReviews(maxReviews);
                if (result.success) {
                  toast.success('Question rotation setting saved');
                } else {
                  toast.error(result.error ?? 'Failed to save');
                }
              });
            }}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
