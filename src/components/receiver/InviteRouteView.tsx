import React, { useEffect, useRef, useState } from 'react';
import {
  fetchGuestInviteByToken,
  recordGuestOpen,
} from '../../services/invitationService';
import type { GuestInviteRecord } from '../../types/invitation';
import { ReceiverInvitationExperience } from './ReceiverInvitationExperience';

interface InviteRouteViewProps {
  token: string;
  onBackHome: () => void;
}

export function InviteRouteView({ token, onBackHome }: InviteRouteViewProps) {
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<GuestInviteRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const recordedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchGuestInviteByToken(token)
      .then(async (data) => {
        if (cancelled) return;
        if (!data || !data.isActive) {
          setInvite(null);
          return;
        }
        setInvite(data);
        if (
          data.invitationSnapshot?.status === 'published' &&
          recordedTokenRef.current !== data.token
        ) {
          recordedTokenRef.current = data.token;
          const updated = await recordGuestOpen(data);
          if (!cancelled) {
            setInvite(updated);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load invitation link:', err);
        if (!cancelled) {
          setError('Unable to open this invitation right now. Please check your internet connection and try again.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-stone-300 border-t-[#8B1E2F] animate-spin mb-4" />
        <p className="text-sm font-display text-stone-700 tracking-wide">
          Preparing your personal invitation...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-display font-semibold text-stone-900">
            Could Not Load Invitation
          </h1>
          <p className="text-sm text-stone-600">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-5 py-2.5 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827]"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="px-5 py-2.5 text-xs font-medium bg-stone-100 text-stone-800 rounded-lg hover:bg-stone-200"
            >
              Return to Vellum
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invite || !invite.isActive) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-display font-semibold text-stone-900">
            Invitation Unavailable
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            This personalized invitation link is no longer active or does not exist. Please contact your host for an updated link.
          </p>
          <button
            type="button"
            onClick={onBackHome}
            className="px-5 py-2.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800"
          >
            Visit Vellum
          </button>
        </div>
      </div>
    );
  }

  if (invite.invitationSnapshot?.status !== 'published') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-display font-semibold text-stone-900">
            Invitation Temporarily Paused
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            The host is currently updating details for &ldquo;{invite.invitationSnapshot?.eventTitle || 'this celebration'}&rdquo;. Please check back soon.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-5 py-2.5 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827]"
            >
              Refresh Invitation
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="px-5 py-2.5 text-xs font-medium bg-stone-100 text-stone-800 rounded-lg hover:bg-stone-200"
            >
              Visit Vellum
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReceiverInvitationExperience
      snapshot={invite.invitationSnapshot}
      guestName={invite.guestName}
      isFamilyInvitation={invite.isFamilyInvitation}
      customGreeting={invite.customGreeting}
      token={invite.token}
      initialRsvpStatus={invite.rsvpStatus}
      initialRsvpAttendees={invite.rsvpAttendees}
      initialRsvpMessage={invite.rsvpMessage}
    />
  );
}
