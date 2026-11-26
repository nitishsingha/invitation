import React from 'react';
import { Eye, RotateCcw } from 'lucide-react';
import { formatDisplayDate } from '../../lib/utils';
import type {
  InvitationCustomization,
  InvitationEventData,
  InvitationSettings,
  InvitationTheme,
  MusicMood,
  OrnamentStyle,
  PatternType,
  ThemeFontChoice,
} from '../../types/invitation';
import { CardCornerOrnaments, PatternOverlay } from '../receiver/ThemeOrnamentSvg';

interface CustomizationStepProps {
  theme: InvitationTheme;
  eventTitle: string;
  eventData: InvitationEventData;
  invitationMessage: string;
  customization: InvitationCustomization;
  settings: InvitationSettings;
  onChangeCustomization: (next: InvitationCustomization) => void;
  onChangeSettings: (next: InvitationSettings) => void;
  onResetToTheme: () => void;
  onOpenFullPreview: () => void;
}

export function CustomizationStep({
  theme,
  eventTitle,
  eventData,
  invitationMessage,
  customization,
  settings,
  onChangeCustomization,
  onChangeSettings,
  onResetToTheme,
  onOpenFullPreview,
}: CustomizationStepProps) {
  const updateCust = <K extends keyof InvitationCustomization>(
    key: K,
    val: InvitationCustomization[K]
  ) => {
    onChangeCustomization({ ...customization, [key]: val });
  };

  const updateSet = <K extends keyof InvitationSettings>(
    key: K,
    val: InvitationSettings[K]
  ) => {
    onChangeSettings({ ...settings, [key]: val });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-stone-900">
            Personalize &amp; Review
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Fine-tune colors, typography, decorations, and interactive guest features before publishing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetToTheme}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Theme Defaults</span>
          </button>
          <button
            type="button"
            onClick={onOpenFullPreview}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Launch Full Preview</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 space-y-6">
          {/* Palette */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900 mb-3">Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Backdrop', key: 'backgroundColor' as const },
                { label: 'Card Paper', key: 'cardColor' as const },
                { label: 'Accent', key: 'accentColor' as const },
                { label: 'Text', key: 'textColor' as const },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2.5 p-2.5 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50"
                >
                  <input
                    type="color"
                    value={customization[item.key]}
                    onChange={(e) => updateCust(item.key, e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs font-medium text-stone-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Typography & Ornaments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Typography Style
              </label>
              <select
                value={customization.fontChoice}
                onChange={(e) =>
                  updateCust('fontChoice', e.target.value as ThemeFontChoice)
                }
                className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
              >
                <option value="cormorant">Editorial Serif (Cormorant)</option>
                <option value="playfair">Classic Serif (Playfair)</option>
                <option value="script-accent">Handwritten Script Accent</option>
                <option value="sans">Modern Sans-Serif</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Background Pattern
              </label>
              <select
                value={customization.pattern}
                onChange={(e) => updateCust('pattern', e.target.value as PatternType)}
                className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
              >
                <option value="none">Clean Paper (No Pattern)</option>
                <option value="filigree">Heritage Filigree</option>
                <option value="botanical">Botanical Sprigs</option>
                <option value="mandala">Sacred Mandala</option>
                <option value="geometric">Art Deco Geometric</option>
                <option value="confetti">Celebration Dots</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Decorative Frame
              </label>
              <select
                value={customization.ornamentStyle}
                onChange={(e) =>
                  updateCust('ornamentStyle', e.target.value as OrnamentStyle)
                }
                className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
              >
                <option value="royal-arch">Royal Arch &amp; Corners</option>
                <option value="floral-corner">Floral Botanical Corners</option>
                <option value="temple-toran">Traditional Garland Toran</option>
                <option value="art-deco">Art Deco Foil Corners</option>
                <option value="festive-bunting">Festive Bunting</option>
                <option value="minimal-hairline">Minimal Hairline Frame</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Ambient Music (Optional)
              </label>
              <select
                value={customization.musicMood}
                onChange={(e) => updateCust('musicMood', e.target.value as MusicMood)}
                className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
              >
                <option value="none">Silent (No Audio)</option>
                <option value="harp-bliss">Gentle Harp Arpeggio</option>
                <option value="celebration-chime">Warm Celebration Chimes</option>
                <option value="serene-flute">Serene Temple Tone</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <h3 className="text-sm font-semibold text-stone-900">
              Interactive Modules &amp; Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: 'Enable Guest RSVP',
                  checked: settings.rsvpEnabled,
                  onChange: (v: boolean) => updateSet('rsvpEnabled', v),
                },
                {
                  label: 'Enable Countdown Timer',
                  checked: settings.countdownEnabled,
                  onChange: (v: boolean) => updateSet('countdownEnabled', v),
                },
                {
                  label: 'Show Photo Gallery',
                  checked: settings.galleryEnabled,
                  onChange: (v: boolean) => updateSet('galleryEnabled', v),
                },
                {
                  label: 'Show Locations & Map',
                  checked: settings.locationsEnabled,
                  onChange: (v: boolean) => updateSet('locationsEnabled', v),
                },
                {
                  label: 'Enable QR Code Downloads',
                  checked: settings.qrEnabled,
                  onChange: (v: boolean) => updateSet('qrEnabled', v),
                },
                {
                  label: 'Decorative Ornaments',
                  checked: customization.floralDecorations,
                  onChange: (v: boolean) => updateCust('floralDecorations', v),
                },
                {
                  label: 'Reduce Ambient Particles',
                  checked: customization.reducedParticles,
                  onChange: (v: boolean) => updateCust('reducedParticles', v),
                },
              ].map((toggle) => (
                <label
                  key={toggle.label}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-800 cursor-pointer hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={toggle.checked}
                    onChange={(e) => toggle.onChange(e.target.checked)}
                    className="w-4 h-4 accent-[#8B1E2F] rounded"
                  />
                  <span>{toggle.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Live Stationery Card Preview */}
        <div className="lg:col-span-5 sticky top-6">
          <div
            className="relative rounded-2xl p-6 sm:p-8 overflow-hidden shadow-lg"
            style={{
              backgroundColor: customization.backgroundColor,
              border: `1px solid ${theme.palette.border}`,
            }}
          >
            <PatternOverlay
              pattern={customization.pattern}
              color={theme.palette.accentSecondary}
            />

            <div
              className="relative z-10 rounded-xl p-7 text-center shadow-xl overflow-hidden"
              style={{
                backgroundColor: customization.cardColor,
                color: customization.textColor,
                border: `1px solid ${theme.palette.border}`,
              }}
            >
              {customization.floralDecorations && (
                <CardCornerOrnaments
                  styleType={customization.ornamentStyle}
                  accentColor={customization.accentColor}
                  secondaryColor={theme.palette.accentSecondary}
                />
              )}

              <p
                className="text-xs italic"
                style={{ color: theme.palette.secondaryText }}
              >
                Dear Rahul Das
              </p>

              <h4
                className={`text-3xl font-semibold mt-3 leading-tight ${
                  customization.fontChoice === 'script-accent'
                    ? 'font-script text-4xl'
                    : customization.fontChoice === 'sans'
                    ? 'font-sans'
                    : 'font-display'
                }`}
                style={{ color: customization.accentColor }}
              >
                {eventData.brideName && eventData.groomName
                  ? `${eventData.brideName} & ${eventData.groomName}`
                  : eventTitle || 'Your Event Title'}
              </h4>

              <p className="text-xs mt-4 leading-relaxed line-clamp-3 opacity-85">
                {invitationMessage ||
                  'Your invitation message will appear here with personalized greetings for every guest.'}
              </p>

              <div
                className="mt-5 pt-4 text-xs space-y-1"
                style={{ borderTop: `1px solid ${theme.palette.border}` }}
              >
                <p className="font-medium">
                  {formatDisplayDate(eventData.eventDate)}
                </p>
                {eventData.primaryVenue && (
                  <p style={{ color: theme.palette.secondaryText }}>
                    {eventData.primaryVenue}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
