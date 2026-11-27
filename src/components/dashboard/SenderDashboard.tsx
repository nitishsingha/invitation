import React, { useMemo, useState } from 'react';
import {
  Copy,
  Eye,
  Globe,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { getThemeById } from '../../data/themes';
import { formatDisplayDate } from '../../lib/utils';
import type {
  EventCategory,
  GuestInviteRecord,
  InvitationRecord,
  InvitationStatus,
} from '../../types/invitation';

interface SenderDashboardProps {
  invitations: InvitationRecord[];
  guestInvites: GuestInviteRecord[];
  categories: EventCategory[];
  loading: boolean;
  onCreateNew: () => void;
  onEdit: (inv: InvitationRecord) => void;
  onManageGuests: (inv: InvitationRecord) => void;
  onPreview: (inv: InvitationRecord) => void;
  onDuplicate: (inv: InvitationRecord) => Promise<void>;
  onDelete: (inv: InvitationRecord) => Promise<void>;
  onTogglePublish: (inv: InvitationRecord) => Promise<void>;
}

export function SenderDashboard({
  invitations,
  guestInvites,
  categories,
  loading,
  onCreateNew,
  onEdit,
  onManageGuests,
  onPreview,
  onDuplicate,
  onDelete,
  onTogglePublish,
}: SenderDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | InvitationStatus>('all');
  const [searchText, setSearchText] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const totalGuests = guestInvites.length;
    const uniqueOpens = guestInvites.filter(
      (g) => g.invitationStatus === 'opened'
    ).length;
    const acceptedRsvps = guestInvites.filter(
      (g) => g.rsvpStatus === 'accepted'
    ).length;
    return {
      totalInvitations: invitations.length,
      totalGuests,
      uniqueOpens,
      acceptedRsvps,
    };
  }, [invitations.length, guestInvites]);

  const filteredInvitations = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return invitations.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (!q) return true;
      return (
        inv.eventTitle.toLowerCase().includes(q) ||
        inv.categorySlug.toLowerCase().includes(q)
      );
    });
  }, [invitations, statusFilter, searchText]);

  const getGuestSummaryForInvitation = (invitationId: string) => {
    const related = guestInvites.filter((g) => g.invitationId === invitationId);
    const opened = related.filter((g) => g.invitationStatus === 'opened').length;
    const accepted = related.filter((g) => g.rsvpStatus === 'accepted').length;
    return { total: related.length, opened, accepted };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-stone-900">
            Invitation
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Manage your interactive invitations, personalized guest links, and RSVP responses.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] whitespace-nowrap shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invitation</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Invitations Created', value: metrics.totalInvitations },
          { label: 'Total Guests Added', value: metrics.totalGuests },
          { label: 'Unique Guest Opens', value: metrics.uniqueOpens },
          { label: 'RSVP Accepted', value: metrics.acceptedRsvps },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-stone-200 rounded-xl px-5 py-4"
          >
            <p className="text-xs text-stone-500">{kpi.label}</p>
            <p className="text-3xl font-mono font-medium text-stone-900 mt-1.5 tabular-nums">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-lg self-start">
          {(['all', 'published', 'draft'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === tab
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search invitations..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
          />
        </div>
      </div>

      {/* Invitations List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 bg-white border border-stone-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredInvitations.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center space-y-4">
          <h2 className="text-2xl font-display font-semibold text-stone-900">
            {invitations.length === 0
              ? 'Create your first digital invitation'
              : 'No invitations match your filter'}
          </h2>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            {invitations.length === 0
              ? 'Choose from 15 celebration categories, customize a tactile animated stationery theme, and share unique links with every guest.'
              : 'Try clearing your search or switching status filters.'}
          </p>
          {invitations.length === 0 && (
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827]"
            >
              <Plus className="w-4 h-4" />
              <span>Start Building</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvitations.map((inv) => {
            const theme = getThemeById(inv.themeId);
            const categoryName =
              categories.find((c) => c.slug === inv.categorySlug)?.name ||
              inv.categorySlug;
            const summary = getGuestSummaryForInvitation(inv.id);
            const isBusy = busyId === inv.id;

            return (
              <div
                key={inv.id}
                className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-16 rounded-lg shrink-0 flex items-center justify-center border"
                    style={{
                      backgroundColor: inv.customization.backgroundColor || theme.palette.background,
                      borderColor: theme.palette.border,
                    }}
                  >
                    <div
                      className="w-8 h-10 rounded-xs shadow-xs"
                      style={{
                        backgroundColor: inv.customization.cardColor || theme.palette.cardSurface,
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-display font-semibold text-stone-900">
                      {inv.eventTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <span>{categoryName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{theme.themeName}</span>
                      {inv.eventData.eventDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{formatDisplayDate(inv.eventData.eventDate)}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          inv.status === 'published'
                            ? 'text-emerald-700 font-medium'
                            : 'text-amber-700 font-medium'
                        }
                      >
                        {inv.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 tabular-nums pt-0.5">
                      {summary.total} guests · {summary.opened} opened
                      {inv.settings.rsvpEnabled ? ` · ${summary.accepted} attending` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onManageGuests(inv)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] whitespace-nowrap"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Guests &amp; Share</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreview(inv)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-stone-100 text-stone-800 rounded-lg hover:bg-stone-200 whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(inv)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-stone-200 text-stone-800 rounded-lg hover:bg-stone-50 whitespace-nowrap"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={async () => {
                      setBusyId(inv.id);
                      try {
                        await onTogglePublish(inv);
                      } finally {
                        setBusyId(null);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg whitespace-nowrap ${
                      inv.status === 'published'
                        ? 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50'
                        : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{inv.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={async () => {
                      setBusyId(inv.id);
                      try {
                        await onDuplicate(inv);
                      } finally {
                        setBusyId(null);
                      }
                    }}
                    aria-label="Duplicate invitation"
                    className="p-2 text-xs bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={async () => {
                      setBusyId(inv.id);
                      try {
                        await onDelete(inv);
                      } finally {
                        setBusyId(null);
                      }
                    }}
                    aria-label="Delete invitation"
                    className="p-2 text-xs bg-white border border-stone-200 text-rose-700 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
