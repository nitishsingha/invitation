import React, { useState } from 'react';
import {
  Award,
  Baby,
  Building2,
  Cake,
  CalendarPlus,
  Check,
  Feather,
  Flame,
  Gem,
  GraduationCap,
  HeartHandshake,
  Home,
  Plane,
  Plus,
  Sparkles,
  Users,
  Utensils,
} from 'lucide-react';
import type { EventCategory } from '../../types/invitation';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartHandshake,
  Cake,
  Sparkles,
  Gem,
  Home,
  Baby,
  Utensils,
  GraduationCap,
  Flame,
  Building2,
  Plane,
  Award,
  Users,
  Feather,
  CalendarPlus,
};

interface CategorySelectorStepProps {
  categories: EventCategory[];
  selectedCategoryId: string;
  onSelectCategory: (category: EventCategory) => void;
  onCreateCustomCategory: (name: string, description: string) => Promise<void>;
}

export function CategorySelectorStep({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCustomCategory,
}: CategorySelectorStepProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim().length < 2) {
      setError('Please enter at least 2 characters for the category name.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await onCreateCustomCategory(customName.trim(), customDescription.trim());
      setCustomName('');
      setCustomDescription('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create custom category.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-stone-900">
            Select Event Category
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Each occasion unlocks curated themes, tailored event fields, and a matching reveal experience.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-white border border-stone-200 rounded-lg text-stone-800 hover:bg-stone-50 whitespace-nowrap shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Custom Category</span>
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Art Exhibition, Cocktail Soiree"
                maxLength={60}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Short Description (Optional)
              </label>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Gallery openings, evening receptions, and showcases"
                maxLength={200}
                className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
          </div>
          {error && <p className="text-xs text-rose-700">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] disabled:opacity-60"
            >
              {creating ? 'Creating...' : 'Add Category'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const IconComp = ICON_MAP[cat.icon] || CalendarPlus;
          const isSelected = cat.id === selectedCategoryId;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`text-left p-5 rounded-xl border transition-all relative ${
                isSelected
                  ? 'bg-white border-[#8B1E2F] ring-2 ring-[#8B1E2F]/15 shadow-sm'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-[#8B1E2F] text-white'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-[#8B1E2F] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <h3 className="text-base font-semibold text-stone-900 mt-4">
                {cat.name}
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {cat.description || 'Custom event invitation suite.'}
              </p>
              {cat.isCustom && (
                <p className="text-[11px] text-[#8B1E2F] font-medium mt-2">
                  Custom Category
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
