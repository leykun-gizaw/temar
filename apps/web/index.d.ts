/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

declare module 'remark-gfm' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remarkGfm: any;
  export default remarkGfm;
}

declare module 'mermaid' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mermaid: any;
  export default mermaid;
}
