import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  MessageCircle,
  Pencil,
  Power,
  QrCode,
  Search,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import {
  buildGuestDisplayGreeting,
  buildWhatsAppShareUrl,
  formatTimestamp,
} from '../../lib/utils';
import {
  addGuestToInvitation,
  deleteGuestFromInvitation,
  fetchGuestsForInvitation,
  importGuestsBulk,
  updateGuestDetails,
} from '../../services/invitationService';
import type {
  CombinedGuestRow,
  InvitationRecord,
} from '../../types/invitation';
import { QrCodeModal } from './QrCodeModal';

interface GuestManagerProps {
  userId: string;
  invitation: InvitationRecord;
  onBack: () => void;
  onOpenGuestLink: (token: string) => void;
  onPublishInvitation?: () => Promise<void>;
}

export function GuestManager({
  userId,
  invitation,
  onBack,
  onOpenGuestLink,
  onPublishInvitation,
}: GuestManagerProps) {
  const [rows, setRows] = useState<CombinedGuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit form state
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [isFamily, setIsFamily] = useState(false);
  const [customGreeting, setCustomGreeting] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingRow, setEditingRow] = useState<CombinedGuestRow | null>(null);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<CombinedGuestRow | null>(null);
  const [publishing, setPublishing] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const isPrivateDevHost =
    typeof window !== 'undefined' && window.location.hostname.startsWith('ais-dev-');

  const defaultShareOrigin = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const { origin, hostname, protocol, port } = window.location;
    if (hostname.startsWith('ais-dev-')) {
      const publicHost = hostname.replace(/^ais-dev-/, 'ais-pre-');
      return `${protocol}//${publicHost}${port ? `:${port}` : ''}`;
    }
    return origin;
  }, []);

  const [shareOrigin, setShareOrigin] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const saved = window.localStorage.getItem('vellum_public_share_origin')?.trim();
      if (saved && /^https?:\/\//i.test(saved)) {
        return saved.replace(/\/+$/, '');
      }
    } catch {
      // Ignore storage restrictions
    }
    return defaultShareOrigin;
  });

  const handlePublishNow = async () => {
    if (!onPublishInvitation) return;
    setPublishing(true);
    setError(null);
    try {
      await onPublishInvitation();
      await loadGuests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish invitation.');
    } finally {
      setPublishing(false);
    }
  };

  const loadGuests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGuestsForInvitation(userId, invitation.id);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load guest list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGuests();
  }, [userId, invitation.id]);

  const stats = useMemo(() => {
    let opened = 0;
    let accepted = 0;
    let declined = 0;
    let maybe = 0;
    let noResponse = 0;

    for (const r of rows) {
      if (r.invite?.invitationStatus === 'opened') opened += 1;
      const rsvp = r.invite?.rsvpStatus ?? 'none';
      if (rsvp === 'accepted') accepted += 1;
      else if (rsvp === 'declined') declined += 1;
      else if (rsvp === 'maybe') maybe += 1;
      else noResponse += 1;
    }

    return {
      total: rows.length,
      opened,
      accepted,
      declined,
      maybe,
      noResponse,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.privateGuest.guestName.toLowerCase().includes(q) ||
        r.privateGuest.phone.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const getInviteUrl = (token: string) => {
    const base = (shareOrigin || defaultShareOrigin || window.location.origin).replace(/\/+$/, '');
    return `${base}/?invite=${token}`;
  };

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      if (editingRow) {
        await updateGuestDetails(invitation.id, editingRow.privateGuest, {
          guestName,
          phone,
          isFamilyInvitation: isFamily,
          customGreeting,
          isActive: editingRow.privateGuest.isActive,
        });
        setRows((prev) =>
          prev.map((item) =>
            item.privateGuest.id === editingRow.privateGuest.id
              ? {
                  privateGuest: {
                    ...item.privateGuest,
                    guestName: guestName.trim(),
                    phone: phone.trim(),
                    isFamilyInvitation: isFamily,
                    customGreeting: customGreeting.trim(),
                  },
                  invite: item.invite
                    ? {
                        ...item.invite,
                        guestName: guestName.trim(),
                        isFamilyInvitation: isFamily,
                        customGreeting: customGreeting.trim(),
                      }
                    : undefined,
                }
              : item
          )
        );
        setEditingRow(null);
      } else {
        const added = await addGuestToInvitation(userId, invitation, {
          guestName,
          phone,
          isFamilyInvitation: isFamily,
          customGreeting,
        });
        setRows((prev) => [added, ...prev]);
      }

      setGuestName('');
      setPhone('');
      setIsFamily(false);
      setCustomGreeting('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save guest.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (row: CombinedGuestRow) => {
    setEditingRow(row);
    setGuestName(row.privateGuest.guestName);
    setPhone(row.privateGuest.phone);
    setIsFamily(row.privateGuest.isFamilyInvitation);
    setCustomGreeting(row.privateGuest.customGreeting);
  };

  const handleToggleActive = async (row: CombinedGuestRow) => {
    const nextActive = !row.privateGuest.isActive;
    try {
      await updateGuestDetails(invitation.id, row.privateGuest, {
        guestName: row.privateGuest.guestName,
        phone: row.privateGuest.phone,
        isFamilyInvitation: row.privateGuest.isFamilyInvitation,
        customGreeting: row.privateGuest.customGreeting,
        isActive: nextActive,
      });
      setRows((prev) =>
        prev.map((item) =>
          item.privateGuest.id === row.privateGuest.id
            ? {
                privateGuest: { ...item.privateGuest, isActive: nextActive },
                invite: item.invite
                  ? { ...item.invite, isActive: nextActive }
                  : undefined,
              }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update link status.');
    }
  };

  const handleDeleteGuest = async (row: CombinedGuestRow) => {
    try {
      await deleteGuestFromInvitation(invitation.id, row.privateGuest);
      setRows((prev) =>
        prev.filter((item) => item.privateGuest.id !== row.privateGuest.id)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete guest.');
    }
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setSubmitting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

      const parsed = rawRows
        .map((r) => {
          const keys = Object.keys(r);
          const findVal = (candidates: string[]) => {
            const matchedKey = keys.find((k) =>
              candidates.includes(k.toLowerCase().trim())
            );
            return matchedKey ? String(r[matchedKey] ?? '').trim() : '';
          };
          const name = findVal(['name', 'guest_name', 'guest name', 'guest', 'full name']);
          const phoneVal = findVal(['phone', 'mobile', 'whatsapp', 'contact']);
          const familyRaw = findVal(['family', 'with_family', 'with family', 'is_family']);
          const greetingVal = findVal(['greeting', 'custom_greeting', 'note']);

          return {
            guestName: name,
            phone: phoneVal,
            isFamilyInvitation:
              familyRaw.toLowerCase() === 'yes' ||
              familyRaw.toLowerCase() === 'true' ||
              familyRaw === '1',
            customGreeting: greetingVal,
          };
        })
        .filter((item) => item.guestName.length > 0);

      if (parsed.length === 0) {
        setError('No guest rows found. Include a "Name" column in your CSV or Excel file.');
        return;
      }

      const added = await importGuestsBulk(userId, invitation, parsed);
      setRows((prev) => [...added, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to import CSV/Excel file.');
    } finally {
      setSubmitting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleDownloadSampleCsv = () => {
    const csv = [
      'Name,Phone,Family,Greeting',
      'Rahul Das,+919830011223,no,We cannot wait to celebrate with you!',
      'Amit Sharma,+919830044556,yes,Warmest welcome to your entire family',
      'Priya Roy,,no,',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vellum-guest-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportRsvp = () => {
    const exportRows = rows.map((r) => ({
      Guest: buildGuestDisplayGreeting(
        r.privateGuest.guestName,
        r.privateGuest.isFamilyInvitation
      ),
      Phone: r.privateGuest.phone || '',
      Status: r.privateGuest.isActive ? 'Active' : 'Deactivated',
      Opened: r.invite?.invitationStatus === 'opened' ? 'Yes' : 'No',
      FirstOpenedAt: formatTimestamp(r.invite?.firstOpenedAt),
      OpenCount: r.invite?.openCount ?? 0,
      RSVP: r.invite?.rsvpStatus ?? 'none',
      Attendees: r.invite?.rsvpAttendees ?? 1,
      Message: r.invite?.rsvpMessage ?? '',
      InviteLink: getInviteUrl(r.privateGuest.uniqueToken),
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guest List & RSVPs');
    XLSX.writeFile(wb, `rsvp-${invitation.id}.xlsx`);
  };

  const handleCopyLink = async (token: string) => {
    await navigator.clipboard.writeText(getInviteUrl(token));
    setCopiedToken(token);
    window.setTimeout(() => setCopiedToken(null), 1800);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-semibold text-stone-900">
              Guests &amp; Personalized Links
            </h1>
            <p className="text-xs text-stone-500">
              {invitation.eventTitle} · {invitation.status === 'published' ? 'Published' : 'Draft'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => void handleImportFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3 py-2 text-xs font-medium bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 whitespace-nowrap"
          >
            Sample CSV
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white border border-stone-200 rounded-lg text-stone-800 hover:bg-stone-50 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV / Excel</span>
          </button>
          {invitation.settings.rsvpEnabled && rows.length > 0 && (
            <button
              type="button"
              onClick={handleExportRsvp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export RSVP</span>
            </button>
          )}
        </div>
      </div>

      {invitation.status !== 'published' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-amber-950">
                This invitation is currently a Draft
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Receivers opening shared links will see &ldquo;Invitation Temporarily Paused&rdquo; until you publish it. Publish now to activate all existing and new guest links.
              </p>
            </div>
          </div>
          {onPublishInvitation && (
            <button
              type="button"
              disabled={publishing}
              onClick={() => void handlePublishNow()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{publishing ? 'Publishing...' : 'Publish Invitation Now'}</span>
            </button>
          )}
        </div>
      )}

      {isPrivateDevHost && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2.5 text-xs text-amber-950">
          <p className="leading-relaxed">
            <strong>Important for sharing on other devices:</strong> Links on <span className="font-mono">{window.location.hostname}</span> only open on your own signed-in device. To open on another device, either publish/share this app in AI Studio so <span className="font-mono">ais-pre-…</span> goes live, or paste your deployed Vercel URL below (or open your Vercel URL directly before copying links):
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="url"
              value={shareOrigin}
              onChange={(e) => {
                const val = e.target.value;
                setShareOrigin(val);
                try {
                  const cleaned = val.trim().replace(/\/+$/, '');
                  if (/^https?:\/\//i.test(cleaned)) {
                    window.localStorage.setItem('vellum_public_share_origin', cleaned);
                  } else if (!cleaned) {
                    window.localStorage.removeItem('vellum_public_share_origin');
                  }
                } catch {
                  // Ignore storage restrictions
                }
              }}
              placeholder={defaultShareOrigin}
              aria-label="Public share base URL"
              className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-amber-300 rounded-lg text-stone-900 focus:outline-none focus:border-[#8B1E2F]"
            />
            {shareOrigin !== defaultShareOrigin && (
              <button
                type="button"
                onClick={() => {
                  setShareOrigin(defaultShareOrigin);
                  try {
                    window.localStorage.removeItem('vellum_public_share_origin');
                  } catch {
                    // Ignore storage restrictions
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-amber-300 rounded-lg text-amber-950 hover:bg-amber-100 whitespace-nowrap"
              >
                Use Shared App URL
              </button>
            )}
          </div>
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Invited', value: stats.total },
          { label: 'Opened', value: stats.opened },
          ...(invitation.settings.rsvpEnabled
            ? [
                { label: 'Accepted', value: stats.accepted },
                { label: 'Maybe', value: stats.maybe },
                { label: 'Declined', value: stats.declined },
                { label: 'No Response', value: stats.noResponse },
              ]
            : []),
        ].map((metric) => (
          <div
            key={metric.label}
            className="bg-white border border-stone-200 rounded-xl px-4 py-3.5"
          >
            <p className="text-xs text-stone-500">{metric.label}</p>
            <p className="text-2xl font-mono font-medium text-stone-900 mt-1 tabular-nums">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Add / Edit Guest Form */}
      <form
        onSubmit={(e) => void handleSaveGuest(e)}
        className="bg-white border border-stone-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">
            {editingRow ? 'Edit Guest Details' : 'Add Personalized Guest'}
          </h2>
          {editingRow && (
            <button
              type="button"
              onClick={() => {
                setEditingRow(null);
                setGuestName('');
                setPhone('');
                setIsFamily(false);
                setCustomGreeting('');
              }}
              className="text-xs text-stone-500 hover:text-stone-900"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              Guest Name *
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g., Rahul Das"
              required
              maxLength={120}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              WhatsApp / Phone (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98300 00000"
              maxLength={30}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              Custom Greeting (Optional)
            </label>
            <input
              type="text"
              value={customGreeting}
              onChange={(e) => setCustomGreeting(e.target.value)}
              placeholder="We cannot wait to host you!"
              maxLength={200}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
            />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFamily}
                onChange={(e) => setIsFamily(e.target.checked)}
                className="w-4 h-4 accent-[#8B1E2F] rounded"
              />
              <span>Invite &ldquo;&amp; Family&rdquo;</span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{editingRow ? 'Save Changes' : 'Generate Unique Link'}</span>
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-rose-700">{error}</p>}
      </form>

      {/* Guest List Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest name or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
            />
          </div>
          <p className="text-xs text-stone-500 tabular-nums">
            Showing {filteredRows.length} of {rows.length} guests
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-stone-500">
            Loading guest links...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-stone-900">
              No guests added yet
            </p>
            <p className="text-xs text-stone-500">
              Add a guest above or import a CSV/Excel list to generate personalized invitation links.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-medium text-stone-500">
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Link Status</th>
                  <th className="py-3 px-4">Opening Activity</th>
                  {invitation.settings.rsvpEnabled && <th className="py-3 px-4">RSVP</th>}
                  <th className="py-3 px-4 text-right">Share &amp; Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {filteredRows.map((row) => {
                  const g = row.privateGuest;
                  const inv = row.invite;
                  const displayName = buildGuestDisplayGreeting(
                    g.guestName,
                    g.isFamilyInvitation
                  );
                  const url = getInviteUrl(g.uniqueToken);
                  const waUrl = buildWhatsAppShareUrl({
                    guestName: g.guestName,
                    isFamily: g.isFamilyInvitation,
                    phone: g.phone,
                    eventTitle: invitation.eventTitle,
                    inviteUrl: url,
                  });

                  return (
                    <tr key={g.id} className="hover:bg-stone-50/60">
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-stone-900">{displayName}</p>
                        <p className="text-xs text-stone-500">
                          {g.phone ? `${g.phone} · ` : ''}
                          <span className="font-mono">?invite={g.uniqueToken.slice(0, 12)}…</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span
                          className={
                            g.isActive
                              ? 'text-emerald-700 font-medium'
                              : 'text-stone-400 font-medium'
                          }
                        >
                          {g.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs tabular-nums">
                        {inv?.invitationStatus === 'opened' ? (
                          <div>
                            <p className="text-stone-900 font-medium">
                              Opened ({inv.openCount}×)
                            </p>
                            <p className="text-stone-500">
                              First: {formatTimestamp(inv.firstOpenedAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-stone-400">Not opened yet</span>
                        )}
                      </td>
                      {invitation.settings.rsvpEnabled && (
                        <td className="py-3.5 px-4 text-xs">
                          {inv?.rsvpStatus === 'accepted' && (
                            <div>
                              <span className="text-emerald-700 font-semibold">
                                Attending ({inv.rsvpAttendees})
                              </span>
                              {inv.rsvpMessage && (
                                <p className="text-stone-500 truncate max-w-[180px]">
                                  {inv.rsvpMessage}
                                </p>
                              )}
                            </div>
                          )}
                          {inv?.rsvpStatus === 'maybe' && (
                            <span className="text-amber-700 font-semibold">
                              Maybe ({inv.rsvpAttendees})
                            </span>
                          )}
                          {inv?.rsvpStatus === 'declined' && (
                            <span className="text-rose-700 font-semibold">Declined</span>
                          )}
                          {(!inv || inv.rsvpStatus === 'none') && (
                            <span className="text-stone-400">No response</span>
                          )}
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-emerald-700 text-white rounded-md hover:bg-emerald-800 whitespace-nowrap"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => void handleCopyLink(g.uniqueToken)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-stone-100 text-stone-800 rounded-md hover:bg-stone-200 whitespace-nowrap"
                          >
                            {copiedToken === g.uniqueToken ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenGuestLink(g.uniqueToken)}
                            aria-label="Open personalized invitation"
                            className="p-1.5 rounded-md border border-stone-200 text-stone-700 hover:bg-stone-50"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {invitation.settings.qrEnabled && (
                            <button
                              type="button"
                              onClick={() => setQrTarget(row)}
                              aria-label="Generate QR code"
                              className="p-1.5 rounded-md border border-stone-200 text-stone-700 hover:bg-stone-50"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(row)}
                            aria-label="Edit guest"
                            className="p-1.5 rounded-md border border-stone-200 text-stone-700 hover:bg-stone-50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(row)}
                            aria-label={g.isActive ? 'Deactivate link' : 'Activate link'}
                            className={`p-1.5 rounded-md border border-stone-200 hover:bg-stone-50 ${
                              g.isActive ? 'text-stone-700' : 'text-amber-700'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteGuest(row)}
                            aria-label="Delete guest"
                            className="p-1.5 rounded-md border border-stone-200 text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {qrTarget && (
        <QrCodeModal
          guestName={qrTarget.privateGuest.guestName}
          isFamilyInvitation={qrTarget.privateGuest.isFamilyInvitation}
          eventTitle={invitation.eventTitle}
          inviteUrl={getInviteUrl(qrTarget.privateGuest.uniqueToken)}
          onClose={() => setQrTarget(null)}
        />
      )}
    </div>
  );
}
