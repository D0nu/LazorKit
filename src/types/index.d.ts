declare module 'gray-matter' {
  interface GrayMatterResult {
    data: { [key: string]: any };
    content: string;
    excerpt?: string;
    orig: Buffer | string;
  }

  function grayMatter(
    input: string | Buffer,
    options?: {
      excerpt?: boolean;
      excerpt_separator?: string;
      engines?: { [key: string]: any };
      language?: string;
      delimiters?: string | [string, string];
    }
  ): GrayMatterResult;

  export = grayMatter;
}

declare module 'remark-gfm' {
  import { Plugin } from 'unified';

  const remarkGfm: Plugin;
  export default remarkGfm;
}

declare module 'react-markdown' {
  import { ReactNode } from 'react';

  export interface ReactMarkdownProps {
    children: string;
    remarkPlugins?: any[];
    rehypePlugins?: any[];
    components?: {
      [nodeType: string]: React.ComponentType<any>;
    };
  }

  const ReactMarkdown: React.ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;
}