import React from 'react';
import { AlertTriangle, Tag } from 'lucide-react';
import { cn } from '../lib/utils';
import { getTaxonomyMeta } from '../lib/taxonomy';

interface TaxonomyTagsProps {
  categories?: string[];
  className?: string;
}

export const TaxonomyTags: React.FC<TaxonomyTagsProps> = ({ categories, className }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {categories.map((cat) => {
        const meta = getTaxonomyMeta(cat);
        return (
          <span
            key={cat}
            title={`${meta.name} — ${meta.description}`}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 select-none cursor-help',
              meta.badgeClass
            )}
          >
            <Tag className="w-3 h-3 opacity-70" />
            {meta.shortLabel}
          </span>
        );
      })}
    </div>
  );
};

interface ManipulationBadgeProps {
  isLikelyManipulated?: boolean;
  className?: string;
}

export const ManipulationBadge: React.FC<ManipulationBadgeProps> = ({
  isLikelyManipulated,
  className,
}) => {
  if (!isLikelyManipulated) return null;

  return (
    <span
      title="Potential deepfake, face-swap, or AI synthetic media detected by OmniGuard pipeline"
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-sm animate-pulse tracking-wide select-none',
        className
      )}
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>⚠ Possible AI manipulation</span>
    </span>
  );
};
