'use client';

import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface ConnectNotionButtonProps {
  authUrl: string;
  trigger?: React.ReactNode;
}

export default function ConnectNotionButton({
  authUrl,
  trigger,
}: ConnectNotionButtonProps) {
  const handleConnect = () => {
    window.location.href = authUrl;
  };

  if (trigger) {
    return <div onClick={handleConnect}>{trigger}</div>;
  }

  return (
    <Button onClick={handleConnect} size="sm">
      <ExternalLink className="mr-1.5 h-4 w-4" />
      Connect to Notion
    </Button>
  );
}
