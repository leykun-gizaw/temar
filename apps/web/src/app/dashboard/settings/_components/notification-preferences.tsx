'use client';

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
    <section className="bg-muted/40 rounded-[2rem] p-8 shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold">Notification Preferences</h3>
      </div>
      <div className="space-y-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-center justify-between p-4 bg-background/60 rounded-xl"
          >
            <div className="space-y-0.5">
              <Label htmlFor={n.id} className="text-sm font-bold">
                {n.title}
              </Label>
              <p className="text-sm text-muted-foreground">{n.description}</p>
            </div>
            <Switch id={n.id} defaultChecked={n.defaultChecked} />
          </div>
        ))}
      </div>
    </section>
  );
}
