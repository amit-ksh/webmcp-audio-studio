import React from 'react'

export type BrandFontFamily = 'jakarta' | 'outfit' | 'space' | 'syne' | 'inter' | 'system'
export type BrandTheme = 'dark' | 'light' | 'ai-glow' | 'emerald' | 'cobalt' | 'frameless'
export type BrandSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface LogoProps {
  /** Text to display as the brand name */
  name?: string
  /** Subtitle or descriptor below or next to the brand name */
  subtitle?: string
  /** Optional badge pill next to the name, e.g. "AI" or "BETA" */
  badge?: string
  /** Font family choice for the brand name */
  fontFamily?: BrandFontFamily
  /** Color theme for the icon and typography */
  theme?: BrandTheme
  /** Predefined size preset or custom height in px */
  size?: BrandSize | number
  /** Whether to show only the icon mark */
  iconOnly?: boolean
  /** Whether to show only the text */
  textOnly?: boolean
  /** Additional CSS class names */
  className?: string
  /** Animate wave bars gently on hover or continuously */
  animated?: boolean
  /** Click handler */
  onClick?: () => void
}

export const BRAND_FONTS: Record<
  BrandFontFamily,
  { label: string; fontStack: string; style: string; className: string }
> = {
  jakarta: {
    label: 'Plus Jakarta Sans',
    fontStack: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    style: 'Modern SaaS Polished',
    className: 'font-jakarta',
  },
  outfit: {
    label: 'Outfit',
    fontStack: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    style: 'Geometric Clean & Friendly',
    className: 'font-outfit',
  },
  space: {
    label: 'Space Grotesk',
    fontStack: '"Space Grotesk", monospace, sans-serif',
    style: 'Cybernetic AI & Tech',
    className: 'font-space',
  },
  syne: {
    label: 'Syne',
    fontStack: '"Syne", sans-serif',
    style: 'Avant-Garde Display',
    className: 'font-syne',
  },
  inter: {
    label: 'Inter',
    fontStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    style: 'Neutral High Precision',
    className: 'font-inter',
  },
  system: {
    label: 'Segoe / Modern Display',
    fontStack: '"Segoe UI Variable Display", -apple-system, "Avenir Next", "Trebuchet MS", sans-serif',
    style: 'Native OS Modern',
    className: 'font-system',
  },
}

const SIZE_MAP: Record<BrandSize, { iconSize: number; textSize: string; gap: string }> = {
  xs: { iconSize: 20, textSize: 'text-sm font-bold tracking-tight', gap: 'gap-1.5' },
  sm: { iconSize: 26, textSize: 'text-base font-bold tracking-tight', gap: 'gap-2' },
  md: { iconSize: 32, textSize: 'text-xl font-extrabold tracking-tight', gap: 'gap-2.5' },
  lg: { iconSize: 42, textSize: 'text-2xl font-extrabold tracking-tight', gap: 'gap-3' },
  xl: { iconSize: 56, textSize: 'text-4xl font-extrabold tracking-tight', gap: 'gap-4' },
}

/**
 * The pure SVG Icon Mark with pixel-wave equalizer geometry
 */
export const LogoMark: React.FC<{
  size?: number
  theme?: BrandTheme
  animated?: boolean
  className?: string
}> = ({ size = 32, theme = 'dark', animated = false, className = '' }) => {
  const getContainerFill = () => {
    switch (theme) {
      case 'dark':
        return '#090D16'
      case 'light':
        return '#FFFFFF'
      case 'ai-glow':
        return 'url(#logo-grad-ai)'
      case 'emerald':
        return '#064E3B'
      case 'cobalt':
        return '#1E40AF'
      case 'frameless':
        return 'transparent'
      default:
        return '#090D16'
    }
  }

  const getBarsFill = () => {
    switch (theme) {
      case 'light':
        return '#090D16'
      case 'frameless':
        return '#090D16'
      default:
        return '#FFFFFF'
    }
  }

  const isFrameless = theme === 'frameless'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none transition-transform duration-200 ${animated ? 'group-hover:scale-105' : ''} ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Gradient for AI-Glow theme */}
        <linearGradient id="logo-grad-ai" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Glow filter for tech vibe */}
        <filter id="logo-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Squircle Background Badge */}
      {!isFrameless && (
        <rect
          width="100"
          height="100"
          rx="22"
          fill={getContainerFill()}
          filter={theme === 'ai-glow' || theme === 'dark' ? 'url(#logo-glow)' : undefined}
          stroke={theme === 'light' ? '#E2E8F0' : 'rgba(255,255,255,0.08)'}
          strokeWidth="1.5"
        />
      )}

      {/* AI Sound Wave / Equalizer Bars */}
      <g fill={getBarsFill()}>
        {/* Column 1: Left square (baseline) */}
        <rect
          x="14"
          y="44"
          width="13"
          height="13"
          rx="2"
          className={animated ? 'transition-all duration-300 group-hover:-translate-y-1' : ''}
        />

        {/* Column 2: Mid-Left Step Bar (mid-high) */}
        <rect
          x="29"
          y="30"
          width="13"
          height="27"
          rx="2"
          className={animated ? 'transition-all duration-300 group-hover:translate-y-0.5' : ''}
        />

        {/* Column 3: Center Peak Tall Pillar */}
        <rect
          x="44"
          y="16"
          width="13"
          height="68"
          rx="2.5"
          className={animated ? 'transition-all duration-300 group-hover:scale-y-105 origin-center' : ''}
        />

        {/* Column 4: Mid-Right Step Bar */}
        <rect
          x="59"
          y="44"
          width="13"
          height="27"
          rx="2"
          className={animated ? 'transition-all duration-300 group-hover:-translate-y-1' : ''}
        />

        {/* Column 5: Right square (baseline) */}
        <rect
          x="74"
          y="44"
          width="13"
          height="13"
          rx="2"
          className={animated ? 'transition-all duration-300 group-hover:translate-y-1' : ''}
        />
      </g>
    </svg>
  )
}

/**
 * Full AI SaaS Logo with SVG Icon Mark & Customizable Typography Font Families
 */
export const AppLogo: React.FC<LogoProps> = ({
  name = 'Waveframe',
  subtitle,
  badge,
  fontFamily = 'jakarta',
  theme = 'dark',
  size = 'md',
  iconOnly = false,
  textOnly = false,
  className = '',
  animated = true,
  onClick,
}) => {
  const sizeConfig =
    typeof size === 'string'
      ? SIZE_MAP[size] || SIZE_MAP.md
      : { iconSize: size, textSize: 'text-xl font-extrabold', gap: 'gap-2.5' }

  const fontConfig = BRAND_FONTS[fontFamily] || BRAND_FONTS.jakarta

  const getTextColor = () => {
    switch (theme) {
      case 'light':
        return 'text-slate-900'
      default:
        return 'text-slate-900'
    }
  }

  return (
    <div
      onClick={onClick}
      className={`group inline-flex items-center ${sizeConfig.gap} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ userSelect: 'none' }}
    >
      {/* SVG Icon Mark */}
      {!textOnly && (
        <LogoMark
          size={sizeConfig.iconSize}
          theme={theme}
          animated={animated}
        />
      )}

      {/* Brand Typography & Badges */}
      {!iconOnly && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`${sizeConfig.textSize} ${getTextColor()} tracking-[-0.035em] transition-colors duration-150`}
              style={{ fontFamily: fontConfig.fontStack }}
            >
              {name}
            </span>

            {badge && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-slate-900 text-white leading-none">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <span
              className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5"
              style={{ fontFamily: fontConfig.fontStack }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Utility to generate standalone pure SVG string code for the logo with chosen font & colors
 */
export function generateLogoSvgString(options: {
  name?: string
  fontFamily?: BrandFontFamily
  theme?: BrandTheme
  width?: number
  height?: number
}): string {
  const {
    name = 'Waveframe',
    fontFamily = 'jakarta',
    theme = 'dark',
    width = 360,
    height = 80,
  } = options

  const fontConfig = BRAND_FONTS[fontFamily] || BRAND_FONTS.jakarta
  const textColor = '#090D16'
  const badgeFill = theme === 'ai-glow' ? '#3B82F6' : theme === 'emerald' ? '#064E3B' : theme === 'cobalt' ? '#1E40AF' : '#090D16'
  const barsFill = theme === 'light' || theme === 'frameless' ? '#090D16' : '#FFFFFF'

  return `<!-- ${name} AI SaaS SVG Logo -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&amp;family=Outfit:wght@700;800&amp;family=Space+Grotesk:wght@700&amp;family=Syne:wght@700;800&amp;display=swap');
      .brand-title {
        font-family: ${fontConfig.fontStack};
        font-weight: 800;
        font-size: 46px;
        letter-spacing: -0.04em;
        fill: ${textColor};
      }
    </style>
  </defs>

  <!-- Logo Mark Icon -->
  <g transform="translate(6, 6)">
    ${
      theme !== 'frameless'
        ? `<rect width="68" height="68" rx="16" fill="${badgeFill}" stroke="rgba(255,255,255,0.08)" stroke-width="1.2" />`
        : ''
    }
    <g fill="${barsFill}">
      <rect x="9.5" y="30" width="9" height="9" rx="1.5" />
      <rect x="20" y="20.5" width="9" height="18.5" rx="1.5" />
      <rect x="30.5" y="11" width="9" height="46" rx="2" />
      <rect x="41" y="30" width="9" height="18.5" rx="1.5" />
      <rect x="51.5" y="30" width="9" height="9" rx="1.5" />
    </g>
  </g>

  <!-- Brand Typography -->
  <text x="92" y="54" class="brand-title">${name}</text>
</svg>`
}
