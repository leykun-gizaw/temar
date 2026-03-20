'use client';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';

/**
 * Visual shell component — notification toggle switches.
 * No backend wiring yet.
 */
export function NotificationPreferences() {
  const notifications = [
    {
      id: 'spaced-rep',
      title: 'Spaced Repetition Reminders',
      description: 'Daily prompts for your optimal recall sessions.',
      defaultChecked: true,
    },
    {
      id: 'weekly-report',
      title: 'Weekly Progress Report',
      description: 'A summary of your learning progress every week.',
      defaultChecked: false,
    },
    {
      id: 'study-tips',
      title: 'AI Study Buddy Tips',
      description: 'Tips and strategies to improve your focus.',
      defaultChecked: false,
    },
  ];

  return (
    <Card className="p-5 rounded-2xl bg-muted/50">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Notification Preferences</h3>
      </div>
      <div className="space-y-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="space-y-0.5">
              <Label htmlFor={n.id} className="text-sm font-medium">
                {n.title}
              </Label>
              <p className="text-xs text-muted-foreground">{n.description}</p>
            </div>
            <Switch id={n.id} defaultChecked={n.defaultChecked} />
          </div>
        ))}
      </div>
    </Card>
  );
}
