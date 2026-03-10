'use client';

import dynamic from 'next/dynamic';

const KnowledgeNetwork = dynamic(
  () => import('./knowledge-network.jsx').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full min-h-[400px] md:min-h-[500px] bg-muted/20 rounded-xl animate-pulse" />
    ),
  }
);

export default function KnowledgeNetworkWrapper() {
  return <KnowledgeNetwork />;
}
