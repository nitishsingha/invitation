import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, Save, Send } from 'lucide-react';
import { getThemeById, getThemesForCategory } from '../../data/themes';
import {
  createInvitation,
  updateInvitation,
} from '../../services/invitationService';
import type {
  EventCategory,
  EventScheduleItem,
  InvitationCustomization,
  InvitationEventData,
  InvitationImage,
  InvitationRecord,
  InvitationSettings,
  InvitationTheme,
  PublicInvitationSnapshot,
} from '../../types/invitation';
import { ReceiverInvitationExperience } from '../receiver/ReceiverInvitationExperience';
import { CategorySelectorStep } from './CategorySelectorStep';
import { CustomizationStep } from './CustomizationStep';
import { DynamicEventFormStep } from './DynamicEventFormStep';
import { PhotoGalleryStep } from './PhotoGalleryStep';
import { ScheduleLocationsStep } from './ScheduleLocationsStep';
import { ThemeGalleryStep } from './ThemeGalleryStep';

interface InvitationBuilderProps {
  userId: string;
  categories: EventCategory[];
  existingInvitation?: InvitationRecord | null;
  onCreateCustomCategory: (name: string, description: string) => Promise<EventCategory>;
  onSaved: (saved: InvitationRecord, openGuests: boolean) => void;
  onCancel: () => void;
}

const STEPS = [
  'Category',
  'Theme',
  'Details',
  'Photos',
  'Locations',
  'Customize',
];

function buildCustomizationFromTheme(theme: InvitationTheme): InvitationCustomization {
  return {
    backgroundColor: theme.palette.background,
    cardColor: theme.palette.cardSurface,
    accentColor: theme.palette.accent,
    textColor: theme.palette.primaryText,
    fontChoice: theme.fontFamily,
    pattern: theme.pattern,
    ornamentStyle: theme.ornamentStyle,
    floralDecorations: true,
    reducedParticles: false,
    musicMood: 'none',
  };
}

export function InvitationBuilder({
  userId,
  categories,
  existingInvitation,
  onCreateCustomCategory,
  onSaved,
  onCancel,
}: InvitationBuilderProps) {
  const initialCategory = useMemo(() => {
    if (existingInvitation) {
      return (
        categories.find((c) => c.slug === existingInvitation.categorySlug) ??
        categories[0]
      );
    }
    return categories[0];
  }, [categories, existingInvitation]);

  const initialThemes = getThemesForCategory(
    initialCategory.slug,
    initialCategory.isCustom
  );
  const initialTheme = existingInvitation
    ? getThemeById(existingInvitation.themeId)
    : initialThemes[0];

  const [step, setStep] = useState(existingInvitation ? 2 : 0);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>(initialCategory);
  const [selectedTheme, setSelectedTheme] = useState<InvitationTheme>(initialTheme);

  const [eventTitle, setEventTitle] = useState(
    existingInvitation?.eventTitle || ''
  );
  const [eventData, setEventData] = useState<InvitationEventData>(
    existingInvitation?.eventData || {
      eventDate: '',
      startTime: '18:30',
      primaryVenue: '',
    }
  );
  const [invitationMessage, setInvitationMessage] = useState(
    existingInvitation?.invitationMessage ||
      'Together with our loved ones, we joyfully invite you to join us and celebrate this unforgettable milestone.'
  );
  const [images, setImages] = useState<InvitationImage[]>(
    existingInvitation?.images || []
  );
  const [schedules, setSchedules] = useState<EventScheduleItem[]>(
    existingInvitation?.schedules || []
  );
  const [customization, setCustomization] = useState<InvitationCustomization>(
    existingInvitation?.customization || buildCustomizationFromTheme(initialTheme)
  );
  const [settings, setSettings] = useState<InvitationSettings>(
    existingInvitation?.settings || {
      rsvpEnabled: true,
      countdownEnabled: true,
      galleryEnabled: true,
      locationsEnabled: true,
      qrEnabled: true,
    }
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSnapshot, setPreviewSnapshot] =
    useState<PublicInvitationSnapshot | null>(null);

  const availableThemes = useMemo(
    () => getThemesForCategory(selectedCategory.slug, selectedCategory.isCustom),
    [selectedCategory]
  );

  const handleSelectCategory = (cat: EventCategory) => {
    setSelectedCategory(cat);
    const themes = getThemesForCategory(cat.slug, cat.isCustom);
    const nextTheme = themes[0];
    setSelectedTheme(nextTheme);
    setCustomization(buildCustomizationFromTheme(nextTheme));
  };

  const handleSelectTheme = (theme: InvitationTheme) => {
    setSelectedTheme(theme);
    setCustomization(buildCustomizationFromTheme(theme));
  };

  const buildSnapshot = (status: 'draft' | 'published'): PublicInvitationSnapshot => ({
    categorySlug: selectedCategory.slug,
    themeId: selectedTheme.id,
    eventTitle: eventTitle.trim() || `${selectedCategory.name} Celebration`,
    eventData,
    invitationMessage,
    customization,
    settings,
    images: images.slice(0, 5),
    schedules: schedules.slice(0, 15),
    status,
  });

  const handleSave = async (status: 'draft' | 'published') => {
    if (!eventTitle.trim()) {
      setError('Please enter an invitation title in Step 3 before saving.');
      setStep(2);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        categoryId: selectedCategory.id,
        categorySlug: selectedCategory.slug,
        themeId: selectedTheme.id,
        eventTitle: eventTitle.trim(),
        eventData,
        invitationMessage,
        customization,
        settings,
        images: images.slice(0, 5),
        schedules: schedules.slice(0, 15),
        status,
      };

      let saved: InvitationRecord;
      if (existingInvitation) {
        saved = { ...existingInvitation, ...payload };
        await updateInvitation(userId, saved);
      } else {
        saved = await createInvitation(userId, payload);
      }
      onSaved(saved, status === 'published');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save invitation.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewTheme = (theme: InvitationTheme) => {
    setPreviewSnapshot({
      categorySlug: selectedCategory.slug,
      themeId: theme.id,
      eventTitle:
        eventTitle.trim() ||
        (selectedCategory.slug === 'wedding'
          ? 'Ananya & Kabir'
          : `${selectedCategory.name} Celebration`),
      eventData: {
        ...eventData,
        brideName:
          eventData.brideName ||
          (selectedCategory.slug === 'wedding' ? 'Ananya' : undefined),
        groomName:
          eventData.groomName ||
          (selectedCategory.slug === 'wedding' ? 'Kabir' : undefined),
        eventDate: eventData.eventDate || '2026-12-18',
        startTime: eventData.startTime || '19:00',
        primaryVenue: eventData.primaryVenue || 'Grand Heritage Courtyard',
      },
      invitationMessage:
        invitationMessage ||
        'With joy and gratitude, we invite you to share this memorable evening with us.',
      customization: buildCustomizationFromTheme(theme),
      settings,
      images,
      schedules,
      status: 'published',
    });
  };

  if (previewSnapshot) {
    return (
      <ReceiverInvitationExperience
        snapshot={previewSnapshot}
        guestName="Rahul Das"
        isFamilyInvitation={false}
        isPreview
        onClosePreview={() => setPreviewSnapshot(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Builder Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-semibold text-stone-900">
              {existingInvitation ? 'Edit Invitation' : 'Create Digital Invitation'}
            </h1>
            <p className="text-xs text-stone-500">
              {selectedCategory.name} · {selectedTheme.themeName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewSnapshot(buildSnapshot('published'))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white border border-stone-200 rounded-lg text-stone-800 hover:bg-stone-50 whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave('draft')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white border border-stone-200 rounded-lg text-stone-800 hover:bg-stone-50 disabled:opacity-50 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] disabled:opacity-50 whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Publish & Add Guests'}</span>
          </button>
        </div>
      </div>

      {/* Stepper Bar */}
      <nav aria-label="Builder steps" className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((label, index) => {
          const active = index === step;
          const completed = index < step;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-stone-900 text-white'
                  : completed
                  ? 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                  : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-800'
              }`}
            >
              <span className="font-mono tabular-nums text-[11px]">
                {completed ? <Check className="w-3.5 h-3.5 inline" /> : `0${index + 1}`}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Active Step Content */}
      <div>
        {step === 0 && (
          <CategorySelectorStep
            categories={categories}
            selectedCategoryId={selectedCategory.id}
            onSelectCategory={(cat) => {
              handleSelectCategory(cat);
              setStep(1);
            }}
            onCreateCustomCategory={async (name, desc) => {
              const created = await onCreateCustomCategory(name, desc);
              handleSelectCategory(created);
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <ThemeGalleryStep
            categoryName={selectedCategory.name}
            themes={availableThemes}
            selectedThemeId={selectedTheme.id}
            onSelectTheme={(theme) => {
              handleSelectTheme(theme);
              setStep(2);
            }}
            onPreviewTheme={handlePreviewTheme}
          />
        )}

        {step === 2 && (
          <DynamicEventFormStep
            categorySlug={selectedCategory.slug}
            categoryName={selectedCategory.name}
            eventTitle={eventTitle}
            onChangeTitle={setEventTitle}
            eventData={eventData}
            onChangeEventData={setEventData}
            invitationMessage={invitationMessage}
            onChangeMessage={setInvitationMessage}
          />
        )}

        {step === 3 && (
          <PhotoGalleryStep
            images={images}
            galleryEnabled={settings.galleryEnabled}
            onChangeImages={setImages}
            onToggleGallery={(v) => setSettings({ ...settings, galleryEnabled: v })}
          />
        )}

        {step === 4 && (
          <ScheduleLocationsStep
            schedules={schedules}
            locationsEnabled={settings.locationsEnabled}
            defaultDate={eventData.eventDate}
            onChangeSchedules={setSchedules}
            onToggleLocations={(v) => setSettings({ ...settings, locationsEnabled: v })}
          />
        )}

        {step === 5 && (
          <CustomizationStep
            theme={selectedTheme}
            eventTitle={eventTitle}
            eventData={eventData}
            invitationMessage={invitationMessage}
            customization={customization}
            settings={settings}
            onChangeCustomization={setCustomization}
            onChangeSettings={setSettings}
            onResetToTheme={() => setCustomization(buildCustomizationFromTheme(selectedTheme))}
            onOpenFullPreview={() => setPreviewSnapshot(buildSnapshot('published'))}
          />
        )}
      </div>

      {/* Bottom Step Navigation */}
      <div className="flex items-center justify-between pt-5 border-t border-stone-200">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous Step</span>
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800"
          >
            <span>Next: {STEPS[step + 1]}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave('published')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? 'Publishing...' : 'Publish & Manage Guests'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
