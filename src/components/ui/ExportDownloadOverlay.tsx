import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

interface ExportDownloadOverlayProps {
  open: boolean;
  filename: string;
  label?: string;
  onComplete: () => void;
}

const CIRCLE_RADIUS = 33;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function ExportDownloadOverlay({
  open,
  filename,
  label = 'Downloading Report',
  onComplete,
}: ExportDownloadOverlayProps) {
  const [phase, setPhase] = useState<'downloading' | 'done'>('downloading');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!open) {
      setPhase('downloading');
      return;
    }

    setPhase('downloading');
    const doneTimer = window.setTimeout(() => {
      setPhase('done');
    }, 1150);

    const closeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, 2950);

    return () => {
      window.clearTimeout(doneTimer);
      window.clearTimeout(closeTimer);
    };
  }, [open, filename]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            if (phase === 'done') onCompleteRef.current();
          }}
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 dark:bg-black/65 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[300px] rounded-[28px] bg-white dark:bg-[#181A1F] border border-stone-200/90 dark:border-zinc-800 shadow-[0_24px_60px_rgba(0,0,0,0.22)] px-6 py-8 flex flex-col items-center text-center"
          >
            {/* Center Animation Stage */}
            <div className="relative h-20 w-20 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === 'downloading' ? (
                  <motion.div
                    key="downloading-stage"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    transition={{ duration: 0.22 }}
                    className="relative h-20 w-20 flex items-center justify-center"
                  >
                    {/* Circular Progress Ring */}
                    <svg className="absolute inset-0 h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r={CIRCLE_RADIUS}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-stone-200/80 dark:text-zinc-800"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r={CIRCLE_RADIUS}
                        fill="none"
                        stroke="#EA580C"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={CIRCLE_CIRCUMFERENCE}
                        initial={{ strokeDashoffset: CIRCLE_CIRCUMFERENCE * 0.92 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </svg>

                    {/* Inner Soft Badge + Bouncing Arrow Into Tray */}
                    <div className="h-14 w-14 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex flex-col items-center justify-center">
                      <motion.svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <motion.g
                          animate={{ y: [-2.5, 2.5, -2.5] }}
                          transition={{ repeat: Infinity, duration: 0.72, ease: 'easeInOut' }}
                        >
                          <path d="M12 4v10" />
                          <path d="m8 10 4 4 4-4" />
                        </motion.g>
                        <path d="M5 18h14" />
                      </motion.svg>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="done-stage"
                    initial={{ scale: 0.65, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                    className="relative h-20 w-20 flex items-center justify-center"
                  >
                    {/* Expanding Green Ripple */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.6 }}
                      animate={{ scale: 1.45, opacity: 0 }}
                      transition={{ duration: 0.75, ease: 'easeOut' }}
                      className="absolute inset-1 rounded-full bg-emerald-500/35"
                    />

                    {/* Soft Emerald Halo */}
                    <div className="h-20 w-20 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 flex items-center justify-center">
                      {/* Solid Green Checkmark Badge */}
                      <motion.div
                        initial={{ scale: 0.7 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 480, damping: 18 }}
                        className="h-14 w-14 rounded-full bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.42)] flex items-center justify-center"
                      >
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                          <motion.path
                            d="M7 14.5L12 19.5L21.5 9.5"
                            stroke="white"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.36, delay: 0.08, ease: 'easeOut' }}
                          />
                        </svg>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Text */}
            {phase === 'downloading' ? (
              <h3 className="mt-4 font-display text-base font-bold text-stone-900 dark:text-zinc-100">
                {label}
              </h3>
            ) : (
              <motion.h3
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.1 }}
                className="mt-4 font-display text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400"
              >
                Downloaded
              </motion.h3>
            )}

            <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400 truncate max-w-full">
              {phase === 'downloading' ? `Preparing ${filename}...` : `${filename} saved to device`}
            </p>

            {/* Bottom Progress Track */}
            <div className="mt-4 h-1.5 w-full rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
              <motion.div
                initial={{ width: '10%' }}
                animate={{ width: phase === 'downloading' ? '82%' : '100%' }}
                transition={{
                  duration: phase === 'downloading' ? 1.05 : 0.25,
                  ease: 'easeOut',
                }}
                className={`h-full rounded-full transition-colors duration-200 ${
                  phase === 'done' ? 'bg-emerald-500' : 'bg-orange-600'
                }`}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
