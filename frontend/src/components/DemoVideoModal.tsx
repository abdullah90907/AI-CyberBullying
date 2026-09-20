import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { YOUTUBE_DEMO_CONFIG, getYouTubeEmbedUrl } from '../config/demoVideo';
import { cn } from '../lib/utils';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  const embedUrl = getYouTubeEmbedUrl(YOUTUBE_DEMO_CONFIG.url);
  const hasVideoUrl = Boolean(embedUrl && YOUTUBE_DEMO_CONFIG.url.trim().length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden z-10 border',
              isDark
                ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-primary/20'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-300/40'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={cn(
              'px-6 py-4 border-b flex items-center justify-between',
              isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50'
            )}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/25">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base md:text-lg tracking-tight">
                      {YOUTUBE_DEMO_CONFIG.title}
                    </h3>
                    <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-red-500/15 text-red-500 border border-red-500/30">
                      YouTube
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  )}>
                    {YOUTUBE_DEMO_CONFIG.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasVideoUrl && (
                  <a
                    href={YOUTUBE_DEMO_CONFIG.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'p-2 rounded-xl transition-colors text-xs font-medium flex items-center gap-1.5',
                      isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                    )}
                    title="Open on YouTube"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden md:inline">Open on YouTube</span>
                  </a>
                )}
                <button
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-xl transition-colors',
                    isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  )}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Body */}
            <div className="p-4 sm:p-6">
              {hasVideoUrl && embedUrl ? (
                <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-inner aspect-video">
                  <iframe
                    src={embedUrl}
                    title={YOUTUBE_DEMO_CONFIG.title}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className={cn(
                  'relative rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[340px]',
                  isDark
                    ? 'border-slate-700/80 bg-slate-950/50'
                    : 'border-slate-300 bg-slate-50'
                )}>
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-xl shadow-red-500/30">
                      <Play className="w-9 h-9 text-white fill-white ml-1" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                  </div>

                  <h4 className="text-xl font-black mb-2">
                    YouTube Demo Video Placeholder
                  </h4>
                  <p className={cn(
                    'text-sm max-w-md mb-6 leading-relaxed',
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  )}>
                    The demo video container is configured and ready. Whenever you have your YouTube link, simply paste it into your configuration file.
                  </p>

                  <div className={cn(
                    'w-full max-w-lg p-4 rounded-xl text-left text-xs font-mono border mb-6',
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
                  )}>
                    <div className="flex items-center gap-2 mb-1.5 text-primary font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Configuration File:</span>
                    </div>
                    <code className="text-red-400">frontend/src/config/demoVideo.ts</code>
                    <div className="mt-2 text-slate-400">
                      Edit <span className="text-amber-400">url: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID'</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={onClose}
                      className={cn(
                        'px-6 py-2.5 rounded-full font-bold text-sm transition-all',
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      )}
                    >
                      Close Preview
                    </button>
                    <a
                      href="https://www.youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit YouTube
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className={cn(
              'px-6 py-3 border-t text-xs flex items-center justify-between',
              isDark ? 'border-slate-800/80 bg-slate-950/40 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
            )}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Multimodal Content Moderation System
              </span>
              <span>FastAPI • React • YouthSafe O1-O11</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default DemoVideoModal;
