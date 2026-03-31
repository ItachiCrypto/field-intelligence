'use client';

import { useMemo } from 'react';
import { getAbbreviations } from '@/lib/abbreviations';

interface AbbreviationHighlightProps {
  text: string;
  className?: string;
}

export function AbbreviationHighlight({ text, className }: AbbreviationHighlightProps) {
  const abbreviations = useMemo(() => getAbbreviations(), []);

  const parts = useMemo(() => {
    if (!text || abbreviations.length === 0) return [{ text, isAbbr: false as const }];

    // Build regex matching whole words for each abbreviation
    const sorted = [...abbreviations].sort((a, b) => b.short.length - a.short.length);
    const pattern = sorted.map(a => `\\b${escapeRegex(a.short)}\\b`).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');

    const result: { text: string; isAbbr: boolean; full?: string }[] = [];
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const index = match.index!;
      if (index > lastIndex) {
        result.push({ text: text.slice(lastIndex, index), isAbbr: false });
      }
      const matched = match[0];
      const abbr = abbreviations.find(a => a.short.toLowerCase() === matched.toLowerCase());
      result.push({ text: matched, isAbbr: true, full: abbr?.full });
      lastIndex = index + matched.length;
    }

    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), isAbbr: false });
    }

    return result;
  }, [text, abbreviations]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.isAbbr ? (
          <span key={i} className="abbr-highlight">
            {part.text}
            <span className="abbr-tooltip">{part.full}</span>
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
