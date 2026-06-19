'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// react-markdown does not render raw HTML by default, so user/AI markdown is
// rendered safely (no XSS via embedded <script>). SECURITY-13.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="doc">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
