import React from "react";

/**
 * SVG-based Islamic geometric border ornaments for the Mushaf page frame.
 * Inspired by traditional Quran page borders with interlocking geometric patterns.
 */

// Corner ornament — 8-pointed star with arabesque flourishes
function CornerOrnament({ className = "", rotate = 0 }: { className?: string; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer geometric frame */}
      <path d="M0 0 L60 0 L60 8 L8 8 L8 60 L0 60 Z" fill="currentColor" opacity="0.12" />
      <path d="M0 0 L60 0 L60 3 L3 3 L3 60 L0 60 Z" fill="currentColor" opacity="0.25" />
      
      {/* 8-pointed star */}
      <g transform="translate(16, 16)">
        <polygon
          points="12,0 15,9 24,9 17,15 19,24 12,19 5,24 7,15 0,9 9,9"
          fill="currentColor"
          opacity="0.2"
        />
        <polygon
          points="12,3 14,9 20,9 15,13 17,20 12,16 7,20 9,13 4,9 10,9"
          fill="currentColor"
          opacity="0.15"
        />
      </g>

      {/* Arabesque curves */}
      <path d="M8 20 Q14 14, 20 8" stroke="currentColor" strokeWidth="1" opacity="0.2" fill="none" />
      <path d="M8 30 Q18 18, 30 8" stroke="currentColor" strokeWidth="0.75" opacity="0.15" fill="none" />
      <path d="M8 40 Q24 24, 40 8" stroke="currentColor" strokeWidth="0.5" opacity="0.12" fill="none" />
      
      {/* Small diamond accents */}
      <rect x="10" y="10" width="4" height="4" transform="rotate(45, 12, 12)" fill="currentColor" opacity="0.18" />
      <rect x="42" y="2" width="3" height="3" transform="rotate(45, 43.5, 3.5)" fill="currentColor" opacity="0.12" />
      <rect x="2" y="42" width="3" height="3" transform="rotate(45, 3.5, 43.5)" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

// Repeating edge pattern — interlocking geometric motif
function EdgePattern({ orientation = "horizontal" }: { orientation?: "horizontal" | "vertical" }) {
  const isH = orientation === "horizontal";
  return (
    <svg
      viewBox={isH ? "0 0 200 12" : "0 0 12 200"}
      className="w-full h-full"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isH ? (
        <>
          {/* Horizontal chain pattern */}
          <line x1="0" y1="6" x2="200" y2="6" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
          <line x1="0" y1="2" x2="200" y2="2" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
          <line x1="0" y1="10" x2="200" y2="10" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
          {Array.from({ length: 20 }, (_, i) => (
            <g key={i} transform={`translate(${i * 10}, 0)`}>
              <rect x="2" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="0.5" opacity="0.12" transform={`rotate(45, 5, 6)`} />
            </g>
          ))}
        </>
      ) : (
        <>
          {/* Vertical chain pattern */}
          <line x1="6" y1="0" x2="6" y2="200" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
          <line x1="2" y1="0" x2="2" y2="200" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
          <line x1="10" y1="0" x2="10" y2="200" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
          {Array.from({ length: 20 }, (_, i) => (
            <g key={i} transform={`translate(0, ${i * 10})`}>
              <rect x="3" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="0.5" opacity="0.12" transform={`rotate(45, 6, 5)`} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

// Surah header ornament — decorative banner frame
export function SurahBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-3 mt-3 mb-2 relative">
      {/* Outer frame */}
      <div className="relative border border-[#8B7355]/30 dark:border-[#C4A96A]/30 rounded-sm overflow-hidden">
        {/* Inner frame with gap */}
        <div className="m-[3px] border border-[#8B7355]/20 dark:border-[#C4A96A]/20 rounded-sm bg-gradient-to-r from-[#F5EFE0]/60 via-[#FFFDF7] to-[#F5EFE0]/60 dark:from-[#1e1708]/60 dark:via-[#2a1f0e] dark:to-[#1e1708]/60 py-2 px-6 relative">
          
          {/* Left wing ornament */}
          <svg className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-6 text-[#8B7355]/40 dark:text-[#C4A96A]/40" viewBox="0 0 40 24" fill="none">
            <path d="M38 12 C30 12, 24 6, 16 6 C10 6, 6 8, 2 12 C6 16, 10 18, 16 18 C24 18, 30 12, 38 12Z" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="6" cy="12" r="2" fill="currentColor" opacity="0.3" />
            <path d="M12 8 L14 12 L12 16" stroke="currentColor" strokeWidth="0.5" />
          </svg>

          {/* Right wing ornament */}
          <svg className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-6 text-[#8B7355]/40 dark:text-[#C4A96A]/40" viewBox="0 0 40 24" fill="none" style={{ transform: 'scaleX(-1) translateY(-50%)', position: 'absolute', top: '50%' }}>
            <path d="M38 12 C30 12, 24 6, 16 6 C10 6, 6 8, 2 12 C6 16, 10 18, 16 18 C24 18, 30 12, 38 12Z" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="6" cy="12" r="2" fill="currentColor" opacity="0.3" />
            <path d="M12 8 L14 12 L12 16" stroke="currentColor" strokeWidth="0.5" />
          </svg>

          {/* Center content */}
          <div className="text-center relative z-10">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Main Mushaf frame wrapper
export default function MushafFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-[#FFFDF7] dark:bg-[#1e1708] rounded-sm shadow-[0_2px_16px_rgba(92,74,42,0.12)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col ${className}`}>

      {/* === Triple border system === */}
      {/* Outer border */}
      <div className="absolute inset-0 border-2 border-[#8B7355]/35 dark:border-[#C4A96A]/35 rounded-sm pointer-events-none" />
      {/* Middle border */}
      <div className="absolute inset-[4px] border border-[#8B7355]/20 dark:border-[#C4A96A]/25 rounded-sm pointer-events-none" />
      {/* Inner border */}
      <div className="absolute inset-[8px] border border-[#8B7355]/12 dark:border-[#C4A96A]/15 rounded-sm pointer-events-none" />

      {/* === Corner ornaments === */}
      <div className="absolute top-0 left-0 w-14 h-14 text-[#8B7355] dark:text-[#C4A96A] pointer-events-none">
        <CornerOrnament className="w-full h-full" rotate={0} />
      </div>
      <div className="absolute top-0 right-0 w-14 h-14 text-[#8B7355] dark:text-[#C4A96A] pointer-events-none">
        <CornerOrnament className="w-full h-full" rotate={90} />
      </div>
      <div className="absolute bottom-0 left-0 w-14 h-14 text-[#8B7355] dark:text-[#C4A96A] pointer-events-none">
        <CornerOrnament className="w-full h-full" rotate={270} />
      </div>
      <div className="absolute bottom-0 right-0 w-14 h-14 text-[#8B7355] dark:text-[#C4A96A] pointer-events-none">
        <CornerOrnament className="w-full h-full" rotate={180} />
      </div>

      {/* === Edge patterns === */}
      {/* Top edge */}
      <div className="absolute top-[1px] left-14 right-14 h-3 text-[#8B7355] dark:text-[#C4A96A] pointer-events-none">
        <EdgePattern orientation="horizontal" />
      </div>
      {/* Bottom edge */}
      <div className="absolute bottom-[1px] left-14 right-14 h-3 text-[#8B7355] dark:text-[#C4A96A] pointer-events-none">
        <EdgePattern orientation="horizontal" />
      </div>
      {/* Left edge */}
      <div className="absolute top-14 bottom-14 left-[1px] w-3 text-[#8B7355] dark:text-[#C4A96A] pointer-events-none">
        <EdgePattern orientation="vertical" />
      </div>
      {/* Right edge */}
      <div className="absolute top-14 bottom-14 right-[1px] w-3 text-[#8B7355] dark:text-[#C4A96A] pointer-events-none">
        <EdgePattern orientation="vertical" />
      </div>

      {/* Content with padding for borders */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
