import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateId, generateSecureToken } from '../lib/utils';
import type {
  CombinedGuestRow,
  EventCategory,
  GuestInviteRecord,
  InvitationRecord,
  PrivateGuestRecord,
  PublicInvitationSnapshot,
  RsvpStatus,
} from '../types/invitation';

function toSnapshot(inv: InvitationRecord): PublicInvitationSnapshot {
  return {
    categorySlug: inv.categorySlug,
    themeId: inv.themeId,
    eventTitle: inv.eventTitle,
    eventData: inv.eventData,
    invitationMessage: inv.invitationMessage,
    customization: inv.customization,
    settings: inv.settings,
    images: inv.images.slice(0, 5),
    schedules: inv.schedules.slice(0, 15),
    status: inv.status,
  };
}

export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    const payload = {
      uid: user.uid,
      displayName: (user.displayName || user.email?.split('@')[0] || 'Host').slice(0, 120),
      email: (user.email || '').slice(0, 200),
      ...(user.photoURL ? { photoURL: user.photoURL.slice(0, 500) } : {}),
    };
    if (!snap.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        displayName: payload.displayName,
        email: payload.email,
        ...(payload.photoURL ? { photoURL: payload.photoURL } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchCustomCategories(userId: string): Promise<EventCategory[]> {
  const path = 'customCategories';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name || ''),
        slug: String(data.slug || ''),
        description: String(data.description || ''),
        icon: String(data.icon || 'CalendarPlus'),
        isCustom: true,
        isActive: Boolean(data.isActive),
        defaultTitlePrefix: `${String(data.name || 'Celebration')}:`,
        sequenceType: 'mandala-curtain',
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createCustomCategory(
  userId: string,
  name: string,
  description: string
): Promise<EventCategory> {
  const id = generateId('cat');
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 55) || 'custom-event';
  const path = `customCategories/${id}`;
  try {
    await setDoc(doc(db, 'customCategories', id), {
      userId,
      name: name.trim().slice(0, 60),
      slug,
      description: description.trim().slice(0, 200),
      icon: 'CalendarPlus',
      isActive: true,
      createdAt: serverTimestamp(),
    });
    return {
      id,
      name: name.trim(),
      slug,
      description: description.trim(),
      icon: 'CalendarPlus',
      isCustom: true,
      isActive: true,
      defaultTitlePrefix: `${name.trim()}:`,
      sequenceType: 'mandala-curtain',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchUserInvitations(userId: string): Promise<InvitationRecord[]> {
  const path = 'invitations';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...(d.data() as Omit<InvitationRecord, 'id'>),
      id: d.id,
    }));
  } catch (error) {
    // Fallback without composite index ordering if index is still building
    try {
      const qFallback = query(collection(db, path), where('userId', '==', userId));
      const snapFallback = await getDocs(qFallback);
      return snapFallback.docs.map((d) => ({
        ...(d.data() as Omit<InvitationRecord, 'id'>),
        id: d.id,
      }));
    } catch (innerError) {
      handleFirestoreError(innerError, OperationType.LIST, path);
    }
  }
}

export async function fetchAllOwnerGuestInvites(userId: string): Promise<GuestInviteRecord[]> {
  const path = 'guestInvites';
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as GuestInviteRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createInvitation(
  userId: string,
  draft: Omit<InvitationRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<InvitationRecord> {
  const id = generateId('inv');
  const path = `invitations/${id}`;
  const cleanImages = draft.images.slice(0, 5);
  const cleanSchedules = draft.schedules.slice(0, 15);
  try {
    await setDoc(doc(db, 'invitations', id), {
      userId,
      categoryId: draft.categoryId,
      categorySlug: draft.categorySlug,
      themeId: draft.themeId,
      eventTitle: draft.eventTitle.trim().slice(0, 140),
      eventData: draft.eventData,
      invitationMessage: draft.invitationMessage.slice(0, 1500),
      customization: draft.customization,
      settings: draft.settings,
      images: cleanImages,
      schedules: cleanSchedules,
      status: draft.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      ...draft,
      id,
      userId,
      images: cleanImages,
      schedules: cleanSchedules,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateInvitation(
  userId: string,
  invitation: InvitationRecord
): Promise<void> {
  const path = `invitations/${invitation.id}`;
  const cleanImages = invitation.images.slice(0, 5);
  const cleanSchedules = invitation.schedules.slice(0, 15);
  const updatedRecord: InvitationRecord = {
    ...invitation,
    images: cleanImages,
    schedules: cleanSchedules,
  };

  try {
    await updateDoc(doc(db, 'invitations', invitation.id), {
      categoryId: updatedRecord.categoryId,
      categorySlug: updatedRecord.categorySlug,
      themeId: updatedRecord.themeId,
      eventTitle: updatedRecord.eventTitle.trim().slice(0, 140),
      eventData: updatedRecord.eventData,
      invitationMessage: updatedRecord.invitationMessage.slice(0, 1500),
      customization: updatedRecord.customization,
      settings: updatedRecord.settings,
      images: cleanImages,
      schedules: cleanSchedules,
      status: updatedRecord.status,
      updatedAt: serverTimestamp(),
    });

    // Propagate updated snapshot to existing guest invite links (single-field query avoids composite index errors)
    const guestInvitesQuery = query(
      collection(db, 'guestInvites'),
      where('ownerId', '==', userId)
    );
    const snap = await getDocs(guestInvitesQuery);
    const matchingDocs = snap.docs.filter(
      (d) => (d.data() as { invitationId?: string }).invitationId === invitation.id
    );
    if (matchingDocs.length > 0) {
      const snapshot = toSnapshot(updatedRecord);
      for (let i = 0; i < matchingDocs.length; i += 450) {
        const chunk = matchingDocs.slice(i, i + 450);
        const batch = writeBatch(db);
        chunk.forEach((d) => {
          batch.update(d.ref, {
            invitationSnapshot: snapshot,
            rsvpEnabled: updatedRecord.settings.rsvpEnabled,
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function duplicateInvitation(
  userId: string,
  source: InvitationRecord
): Promise<InvitationRecord> {
  return createInvitation(userId, {
    categoryId: source.categoryId,
    categorySlug: source.categorySlug,
    themeId: source.themeId,
    eventTitle: `${source.eventTitle} (Copy)`.slice(0, 140),
    eventData: { ...source.eventData },
    invitationMessage: source.invitationMessage,
    customization: { ...source.customization },
    settings: { ...source.settings },
    images: source.images.map((img) => ({ ...img })),
    schedules: source.schedules.map((sch) => ({
      ...sch,
      location: { ...sch.location },
    })),
    status: 'draft',
  });
}

export async function deleteInvitation(userId: string, invitationId: string): Promise<void> {
  const path = `invitations/${invitationId}`;
  try {
    const [privateGuestsSnap, ownerInvitesSnap] = await Promise.all([
      getDocs(query(collection(db, `invitations/${invitationId}/guests`), where('userId', '==', userId))),
      getDocs(query(collection(db, 'guestInvites'), where('ownerId', '==', userId))),
    ]);

    const matchingPublicRefs = ownerInvitesSnap.docs
      .filter((d) => (d.data() as { invitationId?: string }).invitationId === invitationId)
      .map((d) => d.ref);

    const allRefsToDelete = [
      ...privateGuestsSnap.docs.map((d) => d.ref),
      ...matchingPublicRefs,
      doc(db, 'invitations', invitationId),
    ];

    for (let i = 0; i < allRefsToDelete.length; i += 450) {
      const chunk = allRefsToDelete.slice(i, i + 450);
      const batch = writeBatch(db);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchGuestsForInvitation(
  userId: string,
  invitationId: string
): Promise<CombinedGuestRow[]> {
  const privatePath = `invitations/${invitationId}/guests`;
  try {
    const [privateSnap, inviteSnap] = await Promise.all([
      getDocs(query(collection(db, privatePath), where('userId', '==', userId))),
      getDocs(query(collection(db, 'guestInvites'), where('ownerId', '==', userId))),
    ]);

    const inviteMap: Record<string, GuestInviteRecord> = {};
    inviteSnap.docs.forEach((d) => {
      const data = d.data() as GuestInviteRecord;
      if (data.invitationId === invitationId) {
        inviteMap[data.token] = data;
      }
    });

    return privateSnap.docs.map((d) => {
      const privateGuest = {
        ...(d.data() as Omit<PrivateGuestRecord, 'id'>),
        id: d.id,
      };
      return {
        privateGuest,
        invite: inviteMap[privateGuest.uniqueToken],
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, privatePath);
  }
}

export async function addGuestToInvitation(
  userId: string,
  invitation: InvitationRecord,
  input: {
    guestName: string;
    phone?: string;
    isFamilyInvitation: boolean;
    customGreeting?: string;
  }
): Promise<CombinedGuestRow> {
  const guestId = generateId('gst');
  const uniqueToken = generateSecureToken(24);
  const snapshot = toSnapshot(invitation);
  const cleanName = input.guestName.trim().slice(0, 120);
  const cleanPhone = (input.phone || '').trim().slice(0, 30);
  const cleanGreeting = (input.customGreeting || '').trim().slice(0, 200);

  const privateRef = doc(db, `invitations/${invitation.id}/guests`, guestId);
  const publicRef = doc(db, 'guestInvites', uniqueToken);

  try {
    const batch = writeBatch(db);
    batch.set(privateRef, {
      invitationId: invitation.id,
      userId,
      guestName: cleanName,
      phone: cleanPhone,
      uniqueToken,
      isFamilyInvitation: input.isFamilyInvitation,
      customGreeting: cleanGreeting,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(publicRef, {
      token: uniqueToken,
      invitationId: invitation.id,
      ownerId: userId,
      guestName: cleanName,
      isFamilyInvitation: input.isFamilyInvitation,
      customGreeting: cleanGreeting,
      isActive: true,
      invitationSnapshot: snapshot,
      rsvpEnabled: invitation.settings.rsvpEnabled,
      invitationStatus: 'pending',
      rsvpStatus: 'none',
      rsvpAttendees: 1,
      rsvpMessage: '',
      firstOpenedAt: null,
      openCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    return {
      privateGuest: {
        id: guestId,
        invitationId: invitation.id,
        userId,
        guestName: cleanName,
        phone: cleanPhone,
        uniqueToken,
        isFamilyInvitation: input.isFamilyInvitation,
        customGreeting: cleanGreeting,
        isActive: true,
      },
      invite: {
        token: uniqueToken,
        invitationId: invitation.id,
        ownerId: userId,
        guestName: cleanName,
        isFamilyInvitation: input.isFamilyInvitation,
        customGreeting: cleanGreeting,
        isActive: true,
        invitationSnapshot: snapshot,
        rsvpEnabled: invitation.settings.rsvpEnabled,
        invitationStatus: 'pending',
        rsvpStatus: 'none',
        rsvpAttendees: 1,
        rsvpMessage: '',
        firstOpenedAt: null,
        openCount: 0,
      },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `invitations/${invitation.id}/guests/${guestId}`);
  }
}

export async function importGuestsBulk(
  userId: string,
  invitation: InvitationRecord,
  rows: Array<{
    guestName: string;
    phone?: string;
    isFamilyInvitation: boolean;
    customGreeting?: string;
  }>
): Promise<CombinedGuestRow[]> {
  const created: CombinedGuestRow[] = [];
  const snapshot = toSnapshot(invitation);

  // Batch in groups of 100 (2 writes each = 200 ops < 500 Firestore batch limit)
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const batch = writeBatch(db);
    const chunkRecords: CombinedGuestRow[] = [];

    for (const row of chunk) {
      const cleanName = row.guestName.trim().slice(0, 120);
      if (!cleanName) continue;
      const guestId = generateId('gst');
      const uniqueToken = generateSecureToken(24);
      const cleanPhone = (row.phone || '').trim().slice(0, 30);
      const cleanGreeting = (row.customGreeting || '').trim().slice(0, 200);

      batch.set(doc(db, `invitations/${invitation.id}/guests`, guestId), {
        invitationId: invitation.id,
        userId,
        guestName: cleanName,
        phone: cleanPhone,
        uniqueToken,
        isFamilyInvitation: row.isFamilyInvitation,
        customGreeting: cleanGreeting,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(db, 'guestInvites', uniqueToken), {
        token: uniqueToken,
        invitationId: invitation.id,
        ownerId: userId,
        guestName: cleanName,
        isFamilyInvitation: row.isFamilyInvitation,
        customGreeting: cleanGreeting,
        isActive: true,
        invitationSnapshot: snapshot,
        rsvpEnabled: invitation.settings.rsvpEnabled,
        invitationStatus: 'pending',
        rsvpStatus: 'none',
        rsvpAttendees: 1,
        rsvpMessage: '',
        firstOpenedAt: null,
        openCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      chunkRecords.push({
        privateGuest: {
          id: guestId,
          invitationId: invitation.id,
          userId,
          guestName: cleanName,
          phone: cleanPhone,
          uniqueToken,
          isFamilyInvitation: row.isFamilyInvitation,
          customGreeting: cleanGreeting,
          isActive: true,
        },
        invite: {
          token: uniqueToken,
          invitationId: invitation.id,
          ownerId: userId,
          guestName: cleanName,
          isFamilyInvitation: row.isFamilyInvitation,
          customGreeting: cleanGreeting,
          isActive: true,
          invitationSnapshot: snapshot,
          rsvpEnabled: invitation.settings.rsvpEnabled,
          invitationStatus: 'pending',
          rsvpStatus: 'none',
          rsvpAttendees: 1,
          rsvpMessage: '',
          firstOpenedAt: null,
          openCount: 0,
        },
      });
    }

    try {
      await batch.commit();
      created.push(...chunkRecords);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `invitations/${invitation.id}/guests`);
    }
  }

  return created;
}

export async function updateGuestDetails(
  invitationId: string,
  guest: PrivateGuestRecord,
  updates: {
    guestName: string;
    phone: string;
    isFamilyInvitation: boolean;
    customGreeting: string;
    isActive: boolean;
  }
): Promise<void> {
  const cleanName = updates.guestName.trim().slice(0, 120);
  const cleanPhone = updates.phone.trim().slice(0, 30);
  const cleanGreeting = updates.customGreeting.trim().slice(0, 200);

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, `invitations/${invitationId}/guests`, guest.id), {
      guestName: cleanName,
      phone: cleanPhone,
      isFamilyInvitation: updates.isFamilyInvitation,
      customGreeting: cleanGreeting,
      isActive: updates.isActive,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'guestInvites', guest.uniqueToken), {
      guestName: cleanName,
      isFamilyInvitation: updates.isFamilyInvitation,
      customGreeting: cleanGreeting,
      isActive: updates.isActive,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `invitations/${invitationId}/guests/${guest.id}`);
  }
}

export async function deleteGuestFromInvitation(
  invitationId: string,
  guest: PrivateGuestRecord
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, `invitations/${invitationId}/guests`, guest.id));
    batch.delete(doc(db, 'guestInvites', guest.uniqueToken));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `invitations/${invitationId}/guests/${guest.id}`);
  }
}

export async function fetchGuestInviteByToken(token: string): Promise<GuestInviteRecord | null> {
  const cleanToken = token.trim();
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(cleanToken)) {
    return null;
  }
  const path = `guestInvites/${cleanToken}`;
  try {
    const snap = await getDoc(doc(db, 'guestInvites', cleanToken));
    if (!snap.exists()) return null;
    return snap.data() as GuestInviteRecord;
  } catch (error) {
    // Expected permission denied for deactivated or nonexistent tokens
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Missing or insufficient permissions') || message.includes('permission-denied')) {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function recordGuestOpen(invite: GuestInviteRecord): Promise<GuestInviteRecord> {
  const sessionKey = `vellum_opened_${invite.token}`;
  if (typeof window !== 'undefined' && window.sessionStorage.getItem(sessionKey)) {
    return invite;
  }

  const path = `guestInvites/${invite.token}`;
  const isFirstOpen = !invite.firstOpenedAt;

  try {
    await updateDoc(doc(db, 'guestInvites', invite.token), {
      invitationStatus: 'opened',
      openCount: (invite.openCount || 0) + 1,
      ...(isFirstOpen ? { firstOpenedAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(sessionKey, '1');
    }
    return {
      ...invite,
      invitationStatus: 'opened',
      openCount: (invite.openCount || 0) + 1,
      firstOpenedAt: invite.firstOpenedAt || new Date(),
    };
  } catch (error) {
    console.warn('Could not record guest open:', error);
    return invite;
  }
}

export async function submitGuestRsvp(
  token: string,
  rsvpStatus: Exclude<RsvpStatus, 'none'>,
  rsvpAttendees: number,
  rsvpMessage: string
): Promise<void> {
  const path = `guestInvites/${token}`;
  const safeCount = Math.min(20, Math.max(1, Math.round(rsvpAttendees)));
  try {
    await updateDoc(doc(db, 'guestInvites', token), {
      rsvpStatus,
      rsvpAttendees: safeCount,
      rsvpMessage: rsvpMessage.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
