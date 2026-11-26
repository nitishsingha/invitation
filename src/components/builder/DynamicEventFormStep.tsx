import React from 'react';
import type { InvitationEventData } from '../../types/invitation';

interface DynamicEventFormStepProps {
  categorySlug: string;
  categoryName: string;
  eventTitle: string;
  onChangeTitle: (title: string) => void;
  eventData: InvitationEventData;
  onChangeEventData: (next: InvitationEventData) => void;
  invitationMessage: string;
  onChangeMessage: (msg: string) => void;
}

export function DynamicEventFormStep({
  categorySlug,
  categoryName,
  eventTitle,
  onChangeTitle,
  eventData,
  onChangeEventData,
  invitationMessage,
  onChangeMessage,
}: DynamicEventFormStepProps) {
  const updateField = <K extends keyof InvitationEventData>(
    key: K,
    val: InvitationEventData[K]
  ) => {
    onChangeEventData({ ...eventData, [key]: val });
  };

  const isCoupleEvent =
    categorySlug === 'wedding' || categorySlug === 'engagement';
  const isAnniversary = categorySlug === 'anniversary';
  const isBirthday = categorySlug === 'birthday';
  const isChildMilestone =
    categorySlug === 'baby-shower' ||
    categorySlug === 'rice-ceremony' ||
    categorySlug === 'naming-ceremony';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-semibold text-stone-900">
          {categoryName} Details
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Enter the core details for your celebration. Optional fields can be left blank.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1.5">
            Invitation Title *
          </label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            maxLength={140}
            required
            placeholder={
              isCoupleEvent
                ? 'e.g., The Wedding of Ananya & Kabir'
                : isBirthday
                ? "e.g., Aarav's 30th Birthday Soiree"
                : `e.g., ${categoryName} Celebration`
            }
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
          />
        </div>

        {/* Category-specific fields */}
        {isCoupleEvent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                {categorySlug === 'wedding' ? "Bride's Name" : 'Partner 1 Name'}
              </label>
              <input
                type="text"
                value={eventData.brideName || ''}
                onChange={(e) => updateField('brideName', e.target.value)}
                placeholder="e.g., Ananya Chatterjee"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                {categorySlug === 'wedding' ? "Groom's Name" : 'Partner 2 Name'}
              </label>
              <input
                type="text"
                value={eventData.groomName || ''}
                onChange={(e) => updateField('groomName', e.target.value)}
                placeholder="e.g., Kabir Malhotra"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Family Names (Optional)
              </label>
              <input
                type="text"
                value={eventData.familyNames || ''}
                onChange={(e) => updateField('familyNames', e.target.value)}
                placeholder="The Chatterjee & Malhotra Families"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
          </div>
        )}

        {isBirthday && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Birthday Person&apos;s Name
              </label>
              <input
                type="text"
                value={eventData.honoreeName || ''}
                onChange={(e) => updateField('honoreeName', e.target.value)}
                placeholder="e.g., Aarav Sen"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Milestone / Age (Optional)
              </label>
              <input
                type="text"
                value={eventData.ageOrMilestone || ''}
                onChange={(e) => updateField('ageOrMilestone', e.target.value)}
                placeholder="e.g., Turning 30"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
          </div>
        )}

        {isAnniversary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Couple Names
              </label>
              <input
                type="text"
                value={eventData.coupleNames || ''}
                onChange={(e) => updateField('coupleNames', e.target.value)}
                placeholder="e.g., Meera & Vikram"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Anniversary Year (Optional)
              </label>
              <input
                type="text"
                value={eventData.ageOrMilestone || ''}
                onChange={(e) => updateField('ageOrMilestone', e.target.value)}
                placeholder="e.g., 25th Silver Jubilee"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
          </div>
        )}

        {!isCoupleEvent && !isBirthday && !isAnniversary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                {isChildMilestone
                  ? "Baby / Parents' Names"
                  : categorySlug === 'corporate'
                  ? 'Organization / Summit Name'
                  : 'Honoree / Occasion Name'}
              </label>
              <input
                type="text"
                value={eventData.honoreeName || ''}
                onChange={(e) => updateField('honoreeName', e.target.value)}
                placeholder={
                  isChildMilestone
                    ? 'e.g., Baby Reyansh (Son of Riya & Dev)'
                    : 'e.g., Name or Occasion'
                }
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Subtitle / Milestone (Optional)
              </label>
              <input
                type="text"
                value={eventData.ageOrMilestone || ''}
                onChange={(e) => updateField('ageOrMilestone', e.target.value)}
                placeholder="e.g., Class of 2026 / Auspicious Muhurat"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
          </div>
        )}

        {/* Common Date / Time / Venue Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Event Date *
            </label>
            <input
              type="date"
              value={eventData.eventDate}
              onChange={(e) => updateField('eventDate', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              value={eventData.startTime}
              onChange={(e) => updateField('startTime', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              End Time (Optional)
            </label>
            <input
              type="time"
              value={eventData.endTime || ''}
              onChange={(e) => updateField('endTime', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Primary Venue Name
            </label>
            <input
              type="text"
              value={eventData.primaryVenue}
              onChange={(e) => updateField('primaryVenue', e.target.value)}
              placeholder="e.g., ITC Royal Bengal, Kolkata"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Host Name(s) (Optional)
            </label>
            <input
              type="text"
              value={eventData.hostName || ''}
              onChange={(e) => updateField('hostName', e.target.value)}
              placeholder="e.g., Mr. & Mrs. Sengupta"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Dress Code (Optional)
            </label>
            <input
              type="text"
              value={eventData.dressCode || ''}
              onChange={(e) => updateField('dressCode', e.target.value)}
              placeholder="e.g., Traditional Ethnic / Black Tie"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Contact Information (Optional)
            </label>
            <input
              type="text"
              value={eventData.contactInfo || ''}
              onChange={(e) => updateField('contactInfo', e.target.value)}
              placeholder="e.g., +91 98300 00000"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1.5">
            Special Invitation Message
          </label>
          <textarea
            rows={4}
            maxLength={1500}
            value={invitationMessage}
            onChange={(e) => onChangeMessage(e.target.value)}
            placeholder="Share a warm personal note inviting your guests to join this special occasion..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
          />
          <p className="text-[11px] text-stone-400 mt-1 text-right tabular-nums">
            {invitationMessage.length} / 1500
          </p>
        </div>
      </div>
    </div>
  );
}
