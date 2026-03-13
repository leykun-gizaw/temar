/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

declare module 'remark-gfm' {
  const remarkGfm: any;
  export default remarkGfm;
}

declare module 'mermaid' {
  const mermaid: any;
  export default mermaid;
}
