import * as React from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 text-2xl font-medium tracking-tight first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 text-xl font-medium tracking-tight first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-base font-medium tracking-tight first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="my-3 text-[14px] leading-relaxed text-muted-foreground">{children}</p>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1 pl-5 text-[14px] text-muted-foreground marker:text-muted-foreground/50">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-5 text-[14px] text-muted-foreground marker:text-muted-foreground/50">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-border pl-4 text-[14px] text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <code className={cn("font-mono text-[12.5px] leading-relaxed", className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-border bg-muted/40 p-4">
      {children}
    </pre>
  ),
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        className="my-4 w-full rounded-xl border border-border"
        loading="lazy"
      />
    ) : null,
  hr: () => <hr className="my-6 border-border" />,
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
