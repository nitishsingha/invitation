export type AnimationSequenceType =
  | 'envelope-ribbon'
  | 'gift-confetti'
  | 'love-letter'
  | 'mandala-curtain';

export type PatternType =
  | 'none'
  | 'filigree'
  | 'botanical'
  | 'confetti'
  | 'mandala'
  | 'geometric';

export type OrnamentStyle =
  | 'royal-arch'
  | 'floral-corner'
  | 'minimal-hairline'
  | 'temple-toran'
  | 'festive-bunting'
  | 'art-deco';

export type ThemeFontChoice =
  | 'cormorant'
  | 'playfair'
  | 'sans'
  | 'script-accent';

export type MusicMood = 'none' | 'harp-bliss' | 'celebration-chime' | 'serene-flute';

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isCustom?: boolean;
  isActive: boolean;
  defaultTitlePrefix: string;
  sequenceType: AnimationSequenceType;
}

export interface InvitationTheme {
  id: string;
  categorySlug: string;
  themeName: string;
  slug: string;
  tagline: string;
  previewImage?: string;
  sequenceType: AnimationSequenceType;
  ornamentStyle: OrnamentStyle;
  pattern: PatternType;
  particleType: 'petals' | 'gold-dust' | 'confetti' | 'hearts' | 'diyas' | 'none';
  fontFamily: ThemeFontChoice;
  palette: {
    background: string;
    cardSurface: string;
    primaryText: string;
    secondaryText: string;
    accent: string;
    accentSecondary: string;
    border: string;
    envelopeColor: string;
    ribbonColor: string;
  };
  isActive: boolean;
}

export interface EventLocationData {
  venueName: string;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string;
  description: string;
}

export interface EventScheduleItem {
  id: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  description: string;
  displayOrder: number;
  location: EventLocationData;
}

export interface InvitationImage {
  id: string;
  imageUrl: string;
  caption: string;
  displayOrder: number;
}

export interface InvitationEventData {
  brideName?: string;
  groomName?: string;
  honoreeName?: string;
  coupleNames?: string;
  familyNames?: string;
  ageOrMilestone?: string;
  hostName?: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  primaryVenue: string;
  description?: string;
  contactInfo?: string;
  dressCode?: string;
}

export interface InvitationCustomization {
  backgroundColor: string;
  cardColor: string;
  accentColor: string;
  textColor: string;
  fontChoice: ThemeFontChoice;
  pattern: PatternType;
  ornamentStyle: OrnamentStyle;
  floralDecorations: boolean;
  reducedParticles: boolean;
  musicMood: MusicMood;
}

export interface InvitationSettings {
  rsvpEnabled: boolean;
  countdownEnabled: boolean;
  galleryEnabled: boolean;
  locationsEnabled: boolean;
  qrEnabled: boolean;
}

export type InvitationStatus = 'draft' | 'published' | 'archived';

export interface InvitationRecord {
  id: string;
  userId: string;
  categoryId: string;
  categorySlug: string;
  themeId: string;
  eventTitle: string;
  eventData: InvitationEventData;
  invitationMessage: string;
  customization: InvitationCustomization;
  settings: InvitationSettings;
  images: InvitationImage[];
  schedules: EventScheduleItem[];
  status: InvitationStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PrivateGuestRecord {
  id: string;
  invitationId: string;
  userId: string;
  guestName: string;
  phone: string;
  uniqueToken: string;
  isFamilyInvitation: boolean;
  customGreeting: string;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type RsvpStatus = 'none' | 'accepted' | 'declined' | 'maybe';

export interface PublicInvitationSnapshot {
  categorySlug: string;
  themeId: string;
  eventTitle: string;
  eventData: InvitationEventData;
  invitationMessage: string;
  customization: InvitationCustomization;
  settings: InvitationSettings;
  images: InvitationImage[];
  schedules: EventScheduleItem[];
  status: InvitationStatus;
}

export interface GuestInviteRecord {
  token: string;
  invitationId: string;
  ownerId: string;
  guestName: string;
  isFamilyInvitation: boolean;
  customGreeting: string;
  isActive: boolean;
  invitationSnapshot: PublicInvitationSnapshot;
  rsvpEnabled: boolean;
  invitationStatus: 'pending' | 'opened';
  rsvpStatus: RsvpStatus;
  rsvpAttendees: number;
  rsvpMessage: string;
  firstOpenedAt?: unknown;
  openCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CombinedGuestRow {
  privateGuest: PrivateGuestRecord;
  invite?: GuestInviteRecord;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}
