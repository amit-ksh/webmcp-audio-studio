import React, { useState } from 'react'
import {
  X,
  Copy,
  Check,
  Download,
  Sparkles,
  Type,
  Palette,
  Maximize2,
  Code2,
} from 'lucide-react'
import {
  AppLogo,
  LogoMark,
  BRAND_FONTS,
  generateLogoSvgString,
} from './Logo'
import type { BrandFontFamily, BrandTheme, BrandSize } from './Logo'

interface BrandShowcaseModalProps {
  isOpen: boolean
  onClose: () => void
  currentFont: BrandFontFamily
  onSelectFont: (font: BrandFontFamily) => void
  currentName: string
  onSelectName: (name: string) => void
}

export const BrandShowcaseModal: React.FC<BrandShowcaseModalProps> = ({
  isOpen,
  onClose,
  currentFont,
  onSelectFont,
  currentName,
  onSelectName,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<BrandTheme>('dark')
  const [selectedSize, setSelectedSize] = useState<BrandSize>('lg')
  const [copied, setCopied] = useState(false)
  const [showCode, setShowCode] = useState(false)

  if (!isOpen) return null

  const svgCode = generateLogoSvgString({
    name: currentName,
    fontFamily: currentFont,
    theme: selectedTheme,
  })

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svgCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleDownloadSvg = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentName.toLowerCase()}-logo-${currentFont}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog modal-dialog-wide bg-white p-6 relative flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI SaaS Brand &amp; Logo System</h2>
              <p className="text-xs text-slate-500">
                Custom SVG equalizer waveform mark with live typography &amp; font family switching
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Logo Preview Canvas */}
        <div className="relative flex flex-col items-center justify-center p-8 rounded-xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Light preview card inside dark container */}
          <div className="relative z-10 w-full max-w-md p-6 rounded-xl bg-white/95 backdrop-blur shadow-2xl border border-white/20 flex flex-col items-center justify-center gap-4">
            <AppLogo
              name={currentName}
              fontFamily={currentFont}
              theme={selectedTheme}
              size={selectedSize}
              badge="AI"
              subtitle="Audio Production Studio"
            />
          </div>

          <div className="mt-4 flex items-center gap-2 z-10">
            <span className="text-[11px] text-slate-400 font-medium">Active Font:</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono">
              {BRAND_FONTS[currentFont].label}
            </span>
          </div>
        </div>

        {/* Customization Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Left Column: Font Family Selection */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>Choose Font Family</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {(Object.keys(BRAND_FONTS) as BrandFontFamily[]).map((fontKey) => {
                const font = BRAND_FONTS[fontKey]
                const isSelected = currentFont === fontKey
                return (
                  <button
                    key={fontKey}
                    type="button"
                    onClick={() => onSelectFont(fontKey)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-sm'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div
                        className="text-sm font-bold leading-tight"
                        style={{ fontFamily: font.fontStack }}
                      >
                        {font.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{font.style}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: App Name & Styling Options */}
          <div className="flex flex-col gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            {/* App Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>App Name</span>
                <span className="text-[10px] font-normal text-slate-400">Live preview</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => onSelectName(e.target.value || 'Waveframe')}
                  className="input text-xs font-semibold py-1.5"
                  placeholder="e.g. Waveframe, Tecwave..."
                />
                <button
                  type="button"
                  onClick={() => onSelectName('Tecwave')}
                  className="btn btn-secondary text-[11px] px-2.5 py-1 whitespace-nowrap"
                  title="Use Tecwave (from image)"
                >
                  Tecwave
                </button>
                <button
                  type="button"
                  onClick={() => onSelectName('Waveframe')}
                  className="btn btn-secondary text-[11px] px-2.5 py-1 whitespace-nowrap"
                  title="Use Waveframe (default)"
                >
                  Waveframe
                </button>
              </div>
            </div>

            {/* Theme / Badge Color */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                <span>Theme &amp; Accent</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'dark', label: 'Dark Squircle' },
                    { id: 'ai-glow', label: 'AI Glow' },
                    { id: 'cobalt', label: 'Cobalt Studio' },
                    { id: 'emerald', label: 'Emerald Agent' },
                    { id: 'light', label: 'Crisp Light' },
                    { id: 'frameless', label: 'Frameless' },
                  ] as { id: BrandTheme; label: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTheme(t.id)}
                    className={`py-1.5 px-2 rounded-lg text-center font-medium text-[11px] border transition-all ${
                      selectedTheme === t.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Preset */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Size Preset</span>
              </label>
              <div className="flex gap-1.5">
                {(['xs', 'sm', 'md', 'lg', 'xl'] as BrandSize[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`flex-1 py-1 text-center font-bold uppercase text-[10px] rounded-md border transition-all ${
                      selectedSize === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Standalone All Font Families Comparison Matrix */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>Side-by-Side Typography Showcase</span>
            <span className="text-[10px] font-normal text-slate-400">Click any card to activate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(Object.keys(BRAND_FONTS) as BrandFontFamily[]).map((fontKey) => {
              const font = BRAND_FONTS[fontKey]
              const isCurrent = currentFont === fontKey
              return (
                <div
                  key={fontKey}
                  onClick={() => onSelectFont(fontKey)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LogoMark size={22} theme="dark" />
                    <span
                      className="text-base font-extrabold text-slate-900 tracking-tight"
                      style={{ fontFamily: font.fontStack }}
                    >
                      {currentName}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    {font.label.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* SVG Code Drawer & Actions */}
        {showCode && (
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>Pure SVG Code Preview</span>
              <button
                type="button"
                onClick={() => setShowCode(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Hide
              </button>
            </div>
            <pre className="max-h-36 overflow-y-auto p-2 rounded bg-slate-950 text-slate-300 text-[10px] whitespace-pre-wrap select-all">
              {svgCode}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{showCode ? 'Hide SVG Code' : 'View SVG Code'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySvg}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied SVG!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy SVG Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .SVG</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
