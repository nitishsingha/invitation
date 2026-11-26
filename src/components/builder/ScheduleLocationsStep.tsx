import React from 'react';
import { ArrowDown, ArrowUp, MapPinPlus, Trash2 } from 'lucide-react';
import { generateId } from '../../lib/utils';
import type { EventScheduleItem } from '../../types/invitation';
import { LocationPicker } from '../maps/LocationPicker';

interface ScheduleLocationsStepProps {
  schedules: EventScheduleItem[];
  locationsEnabled: boolean;
  defaultDate: string;
  onChangeSchedules: (next: EventScheduleItem[]) => void;
  onToggleLocations: (enabled: boolean) => void;
}

export function ScheduleLocationsStep({
  schedules,
  locationsEnabled,
  defaultDate,
  onChangeSchedules,
  onToggleLocations,
}: ScheduleLocationsStepProps) {
  const addSchedule = () => {
    const nextItem: EventScheduleItem = {
      id: generateId('sch'),
      eventName: schedules.length === 0 ? 'Main Ceremony' : `Function ${schedules.length + 1}`,
      eventDate: defaultDate || '',
      startTime: '18:30',
      endTime: '',
      description: '',
      displayOrder: schedules.length,
      location: {
        venueName: '',
        fullAddress: '',
        city: '',
        state: '',
        postalCode: '',
        latitude: null,
        longitude: null,
        googleMapsUrl: '',
        description: '',
      },
    };
    onChangeSchedules([...schedules, nextItem]);
  };

  const updateSchedule = (id: string, patch: Partial<EventScheduleItem>) => {
    onChangeSchedules(
      schedules.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const moveSchedule = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= schedules.length) return;
    const copy = [...schedules];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onChangeSchedules(copy.map((s, idx) => ({ ...s, displayOrder: idx })));
  };

  const removeSchedule = (id: string) => {
    onChangeSchedules(
      schedules
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, displayOrder: idx }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-stone-900">
            Functions &amp; Event Locations
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Add one or multiple ceremonies (e.g., Haldi, Mehendi, Ceremony, Reception), each with its own schedule and Google Maps pin.
          </p>
        </div>

        <label className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-800 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={locationsEnabled}
            onChange={(e) => onToggleLocations(e.target.checked)}
            className="w-4 h-4 accent-[#8B1E2F] rounded"
          />
          <span>Show locations &amp; map</span>
        </label>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-stone-600">
            No event locations added yet. If left empty, the location section will stay hidden on the invitation.
          </p>
          <button
            type="button"
            onClick={addSchedule}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <MapPinPlus className="w-4 h-4" />
            <span>Add First Function &amp; Venue</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {schedules.map((sch, idx) => (
            <div
              key={sch.id}
              className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 space-y-5"
            >
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <h3 className="text-base font-semibold text-stone-900 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}. {sch.eventName || 'Untitled Function'}
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSchedule(idx, -1)}
                    aria-label="Move function up"
                    className="p-1.5 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-35"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === schedules.length - 1}
                    onClick={() => moveSchedule(idx, 1)}
                    aria-label="Move function down"
                    className="p-1.5 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-35"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSchedule(sch.id)}
                    aria-label="Delete function"
                    className="p-1.5 rounded-md border border-stone-200 text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Function / Event Name
                  </label>
                  <input
                    type="text"
                    value={sch.eventName}
                    onChange={(e) => updateSchedule(sch.id, { eventName: e.target.value })}
                    placeholder="e.g., Haldi Ceremony, Reception Dinner"
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sch.eventDate}
                    onChange={(e) => updateSchedule(sch.id, { eventDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      Start
                    </label>
                    <input
                      type="time"
                      value={sch.startTime}
                      onChange={(e) => updateSchedule(sch.id, { startTime: e.target.value })}
                      className="w-full px-2.5 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      End
                    </label>
                    <input
                      type="time"
                      value={sch.endTime}
                      onChange={(e) => updateSchedule(sch.id, { endTime: e.target.value })}
                      className="w-full px-2.5 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Schedule Note (Optional)
                </label>
                <input
                  type="text"
                  value={sch.description}
                  onChange={(e) => updateSchedule(sch.id, { description: e.target.value })}
                  placeholder="e.g., Followed by traditional lunch & folk music"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
                />
              </div>

              <div className="pt-2 border-t border-stone-100">
                <LocationPicker
                  value={sch.location}
                  onChange={(nextLoc) => updateSchedule(sch.id, { location: nextLoc })}
                />
              </div>
            </div>
          ))}

          {schedules.length < 15 && (
            <button
              type="button"
              onClick={addSchedule}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-white border border-stone-300 text-stone-900 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <MapPinPlus className="w-4 h-4" />
              <span>Add Another Function / Location</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
