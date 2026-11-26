import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InvitationBuilder } from './components/builder/InvitationBuilder';
import { SenderDashboard } from './components/dashboard/SenderDashboard';
import { GuestManager } from './components/guests/GuestManager';
import { LandingPage } from './components/landing/LandingPage';
import { InviteRouteView } from './components/receiver/InviteRouteView';
import { ReceiverInvitationExperience } from './components/receiver/ReceiverInvitationExperience';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BUILT_IN_CATEGORIES } from './data/categories';
import { testConnection } from './lib/firebase';
import {
  createCustomCategory,
  deleteInvitation,
  duplicateInvitation,
  fetchAllOwnerGuestInvites,
  fetchCustomCategories,
  fetchUserInvitations,
  updateInvitation,
} from './services/invitationService';
import type {
  EventCategory,
  GuestInviteRecord,
  InvitationRecord,
} from './types/invitation';

function extractInviteTokenFromLocation(): string | null {
  const pathMatch = window.location.pathname.match(/^\/invite\/([A-Za-z0-9_-]{8,120})/);
  if (pathMatch) {
    return pathMatch[1];
  }
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get('invite')?.trim();
  if (queryToken) {
    const cleanQuery = queryToken.match(/^([A-Za-z0-9_-]{8,120})/);
    if (cleanQuery) return cleanQuery[1];
  }
  const hashMatch = window.location.hash.match(/#\/?invite\/([A-Za-z0-9_-]{8,120})/);
  if (hashMatch) {
    return hashMatch[1];
  }
  return null;
}

type StudioView = 'dashboard' | 'builder' | 'guests';

function AuthenticatedWorkspace({
  onOpenGuestLink,
}: {
  onOpenGuestLink: (token: string) => void;
}) {
  const { user, loading: authLoading, authError, signInWithGoogle, logout } = useAuth();

  const [view, setView] = useState<StudioView>('dashboard');
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [guestInvites, setGuestInvites] = useState<GuestInviteRecord[]>([]);
  const [customCategories, setCustomCategories] = useState<EventCategory[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editingInvitation, setEditingInvitation] = useState<InvitationRecord | null>(null);
  const [activeGuestInvitation, setActiveGuestInvitation] =
    useState<InvitationRecord | null>(null);
  const [previewInvitation, setPreviewInvitation] =
    useState<InvitationRecord | null>(null);

  const allCategories = useMemo(
    () => [...BUILT_IN_CATEGORIES, ...customCategories],
    [customCategories]
  );

  const loadWorkspaceData = useCallback(async (uid: string) => {
    setDataLoading(true);
    setActionError(null);
    try {
      const [invs, invites, customCats] = await Promise.all([
        fetchUserInvitations(uid),
        fetchAllOwnerGuestInvites(uid),
        fetchCustomCategories(uid),
      ]);
      setInvitations(invs);
      setGuestInvites(invites);
      setCustomCategories(customCats);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to load your invitations.'
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    void testConnection();
  }, []);

  useEffect(() => {
    if (user) {
      void loadWorkspaceData(user.uid);
    } else {
      setInvitations([]);
      setGuestInvites([]);
      setCustomCategories([]);
      setView('dashboard');
    }
  }, [user, loadWorkspaceData]);

  if (previewInvitation) {
    return (
      <ReceiverInvitationExperience
        snapshot={{
          categorySlug: previewInvitation.categorySlug,
          themeId: previewInvitation.themeId,
          eventTitle: previewInvitation.eventTitle,
          eventData: previewInvitation.eventData,
          invitationMessage: previewInvitation.invitationMessage,
          customization: previewInvitation.customization,
          settings: previewInvitation.settings,
          images: previewInvitation.images,
          schedules: previewInvitation.schedules,
          status: previewInvitation.status,
        }}
        guestName="Rahul Das"
        isPreview
        onClosePreview={() => setPreviewInvitation(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      {/* Three-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setView('dashboard');
              setEditingInvitation(null);
              setActiveGuestInvitation(null);
            }}
            className="font-display text-2xl font-semibold tracking-tight text-stone-900 whitespace-nowrap shrink-0"
          >
            Vellum
          </button>

          {/* Zone 2: Clean Text Navigation Links */}
          <nav className="hidden sm:flex items-center gap-8 text-sm font-medium text-stone-600">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setView('dashboard');
                    setEditingInvitation(null);
                    setActiveGuestInvitation(null);
                  }}
                  className={`whitespace-nowrap shrink-0 transition-colors ${
                    view === 'dashboard'
                      ? 'text-stone-900 font-semibold'
                      : 'hover:text-stone-900'
                  }`}
                >
                  My Invitations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingInvitation(null);
                    setView('builder');
                  }}
                  className={`whitespace-nowrap shrink-0 transition-colors ${
                    view === 'builder'
                      ? 'text-stone-900 font-semibold'
                      : 'hover:text-stone-900'
                  }`}
                >
                  Builder
                </button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="whitespace-nowrap shrink-0 hover:text-stone-900 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <a
                  href="#demos"
                  className="whitespace-nowrap shrink-0 hover:text-stone-900 transition-colors"
                >
                  Sample Cards
                </a>
                <a
                  href="#categories"
                  className="whitespace-nowrap shrink-0 hover:text-stone-900 transition-colors"
                >
                  Categories
                </a>
              </>
            )}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setEditingInvitation(null);
                  setView('builder');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] whitespace-nowrap shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Invitation</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={authLoading}
                onClick={() => void signInWithGoogle()}
                className="px-4 py-2 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] disabled:opacity-50 whitespace-nowrap shrink-0 transition-colors"
              >
                {authLoading ? 'Loading...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      </header>

      {actionError && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-4">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="underline font-medium shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {authLoading ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#8B1E2F] animate-spin" />
        </div>
      ) : !user ? (
        <LandingPage onSignIn={signInWithGoogle} authError={authError} />
      ) : (
        <>
          {view === 'dashboard' && (
            <SenderDashboard
              invitations={invitations}
              guestInvites={guestInvites}
              categories={allCategories}
              loading={dataLoading}
              onCreateNew={() => {
                setEditingInvitation(null);
                setView('builder');
              }}
              onEdit={(inv) => {
                setEditingInvitation(inv);
                setView('builder');
              }}
              onManageGuests={(inv) => {
                setActiveGuestInvitation(inv);
                setView('guests');
              }}
              onPreview={(inv) => setPreviewInvitation(inv)}
              onDuplicate={async (inv) => {
                try {
                  const copy = await duplicateInvitation(user.uid, inv);
                  setInvitations((prev) => [copy, ...prev]);
                } catch (err) {
                  setActionError(
                    err instanceof Error ? err.message : 'Unable to duplicate invitation.'
                  );
                }
              }}
              onDelete={async (inv) => {
                try {
                  await deleteInvitation(user.uid, inv.id);
                  setInvitations((prev) => prev.filter((item) => item.id !== inv.id));
                  setGuestInvites((prev) =>
                    prev.filter((g) => g.invitationId !== inv.id)
                  );
                } catch (err) {
                  setActionError(
                    err instanceof Error ? err.message : 'Unable to delete invitation.'
                  );
                }
              }}
              onTogglePublish={async (inv) => {
                const nextStatus = inv.status === 'published' ? 'draft' : 'published';
                const updated: InvitationRecord = { ...inv, status: nextStatus };
                try {
                  await updateInvitation(user.uid, updated);
                  setInvitations((prev) =>
                    prev.map((item) => (item.id === inv.id ? updated : item))
                  );
                } catch (err) {
                  setActionError(
                    err instanceof Error ? err.message : 'Unable to update status.'
                  );
                }
              }}
            />
          )}

          {view === 'builder' && (
            <InvitationBuilder
              userId={user.uid}
              categories={allCategories}
              existingInvitation={editingInvitation}
              onCreateCustomCategory={async (name, description) => {
                const created = await createCustomCategory(user.uid, name, description);
                setCustomCategories((prev) => [...prev, created]);
                return created;
              }}
              onSaved={(saved, openGuests) => {
                setInvitations((prev) => {
                  const exists = prev.some((i) => i.id === saved.id);
                  return exists
                    ? prev.map((i) => (i.id === saved.id ? saved : i))
                    : [saved, ...prev];
                });
                void loadWorkspaceData(user.uid);
                if (openGuests) {
                  setActiveGuestInvitation(saved);
                  setView('guests');
                } else {
                  setView('dashboard');
                }
              }}
              onCancel={() => {
                setEditingInvitation(null);
                setView('dashboard');
              }}
            />
          )}

          {view === 'guests' && activeGuestInvitation && (
            <GuestManager
              userId={user.uid}
              invitation={activeGuestInvitation}
              onBack={() => {
                void loadWorkspaceData(user.uid);
                setView('dashboard');
              }}
              onOpenGuestLink={onOpenGuestLink}
              onPublishInvitation={async () => {
                const updated: InvitationRecord = {
                  ...activeGuestInvitation,
                  status: 'published',
                };
                await updateInvitation(user.uid, updated);
                setActiveGuestInvitation(updated);
                setInvitations((prev) =>
                  prev.map((item) => (item.id === updated.id ? updated : item))
                );
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  const [inviteToken, setInviteToken] = useState<string | null>(() =>
    extractInviteTokenFromLocation()
  );
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const onPopState = () => {
      setInviteToken(extractInviteTokenFromLocation());
    };
    const onQuotaExceeded = () => {
      setGmpQuotaExceeded(true);
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
    };
  }, []);

  const navigateToGuestLink = (token: string) => {
    window.history.pushState({}, '', `/?invite=${token}`);
    setInviteToken(token);
  };

  const navigateHome = () => {
    window.history.pushState({}, '', '/');
    setInviteToken(null);
  };

  return (
    <ErrorBoundary>
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {inviteToken ? (
        <InviteRouteView token={inviteToken} onBackHome={navigateHome} />
      ) : (
        <AuthProvider>
          <AuthenticatedWorkspace onOpenGuestLink={navigateToGuestLink} />
        </AuthProvider>
      )}
    </ErrorBoundary>
  );
}
