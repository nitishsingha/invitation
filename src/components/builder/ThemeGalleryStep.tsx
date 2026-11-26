import React from 'react';
import { Check, Eye } from 'lucide-react';
import type { InvitationTheme } from '../../types/invitation';

interface ThemeGalleryStepProps {
  categoryName: string;
  themes: InvitationTheme[];
  selectedThemeId: string;
  onSelectTheme: (theme: InvitationTheme) => void;
  onPreviewTheme: (theme: InvitationTheme) => void;
}

const SEQUENCE_LABELS: Record<InvitationTheme['sequenceType'], string> = {
  'envelope-ribbon': 'Envelope & Ribbon Cut',
  'gift-confetti': 'Gift Box & Confetti',
  'love-letter': 'Wax-Sealed Letter',
  'mandala-curtain': 'Ceremonial Curtain Reveal',
};

export function ThemeGalleryStep({
  categoryName,
  themes,
  selectedThemeId,
  onSelectTheme,
  onPreviewTheme,
}: ThemeGalleryStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold text-stone-900">
          Choose a Theme for {categoryName}
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Preview any complete interactive card experience before selecting it for your event.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {themes.map((theme) => {
          const isSelected = theme.id === selectedThemeId;
          return (
            <div
              key={theme.id}
              className={`rounded-xl border overflow-hidden flex flex-col bg-white transition-all ${
                isSelected
                  ? 'border-[#8B1E2F] ring-2 ring-[#8B1E2F]/15 shadow-sm'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              {/* Visual Stationery Thumbnail */}
              <div
                onClick={() => onSelectTheme(theme)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTheme(theme);
                  }
                }}
                className="relative h-56 p-5 flex items-center justify-center cursor-pointer overflow-hidden"
                style={{ backgroundColor: theme.palette.background }}
              >
                {theme.previewImage && (
                  <img
                    src={theme.previewImage}
                    alt={theme.themeName}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                  />
                )}
                <div
                  className="relative z-10 w-full max-w-[210px] rounded-lg p-5 text-center shadow-lg"
                  style={{
                    backgroundColor: theme.palette.cardSurface,
                    border: `1px solid ${theme.palette.border}`,
                    color: theme.palette.primaryText,
                  }}
                >
                  <p
                    className="text-[11px] tracking-wide"
                    style={{ color: theme.palette.secondaryText }}
                  >
                    Dear Guest
                  </p>
                  <p
                    className={`text-xl font-semibold mt-1 leading-tight ${
                      theme.fontFamily === 'sans' ? 'font-sans' : 'font-display'
                    }`}
                    style={{ color: theme.palette.accent }}
                  >
                    {theme.themeName}
                  </p>
                  <div
                    className="w-8 h-0.5 mx-auto mt-2.5"
                    style={{ backgroundColor: theme.palette.accentSecondary }}
                  />
                </div>

                {isSelected && (
                  <span className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-[#8B1E2F] text-white flex items-center justify-center shadow">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-stone-900">
                    {theme.themeName}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {theme.tagline}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-2">
                    {SEQUENCE_LABELS[theme.sequenceType]}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => onPreviewTheme(theme)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-stone-100 text-stone-800 rounded-lg hover:bg-stone-200 transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTheme(theme)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#8B1E2F] text-white'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Use Theme'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
