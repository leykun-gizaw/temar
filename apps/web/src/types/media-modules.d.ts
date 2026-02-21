declare module 'react-lite-youtube-embed' {
  import type { ComponentType } from 'react';
  interface LiteYouTubeEmbedProps {
    id: string;
    title?: string;
    [key: string]: unknown;
  }
  const LiteYouTubeEmbed: ComponentType<LiteYouTubeEmbedProps>;
  export default LiteYouTubeEmbed;
}
