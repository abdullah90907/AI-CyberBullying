import React from 'react';
import { cn } from '../lib/utils';

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
  isDark: boolean;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, isUser, isDark }) => {
  if (isUser) {
    return <div className="text-sm md:text-base whitespace-pre-wrap">{content}</div>;
  }

  // Parse inline **bold** and *italic*
  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={i} className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={i} className="italic opacity-90">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${renderedElements.length}`} className="space-y-2 my-2 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      renderedElements.push(
        <hr key={`hr-${index}`} className={cn("my-3 border-t", isDark ? "border-slate-700" : "border-slate-200")} />
      );
      return;
    }

    // Headers: ### Header or ## Header or # Header
    if (trimmed.startsWith('#')) {
      flushList();
      const headerText = trimmed.replace(/^#+\s*/, '');
      renderedElements.push(
        <h4 key={`h-${index}`} className={cn("font-bold text-base mt-3 mb-1.5", isDark ? "text-primary" : "text-primary")}>
          {renderInline(headerText)}
        </h4>
      );
      return;
    }

    // Bullet points: - item or * item
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      listItems.push(
        <li key={`li-${index}`} className="flex items-start gap-2.5 text-sm md:text-base leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-sm" />
          <span className="flex-1">{renderInline(bulletMatch[1])}</span>
        </li>
      );
      return;
    }

    // Numbered points: 1. item
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      listItems.push(
        <li key={`num-${index}`} className="flex items-start gap-2.5 text-sm md:text-base leading-relaxed">
          <span className={cn(
            "text-[11px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5",
            isDark ? "bg-primary/20 text-indigo-300" : "bg-primary/10 text-primary"
          )}>
            {numberedMatch[1]}
          </span>
          <span className="flex-1">{renderInline(numberedMatch[2])}</span>
        </li>
      );
      return;
    }

    // Regular paragraph line
    flushList();
    renderedElements.push(
      <p key={`p-${index}`} className="text-sm md:text-base leading-relaxed mb-1.5">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{renderedElements}</div>;
};
