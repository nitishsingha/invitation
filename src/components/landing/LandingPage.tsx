import React, { useState } from 'react';
import { ArrowRight, Eye, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { BUILT_IN_CATEGORIES } from '../../data/categories';
import { getThemeById } from '../../data/themes';
import type { PublicInvitationSnapshot } from '../../types/invitation';
import { ReceiverInvitationExperience } from '../receiver/ReceiverInvitationExperience';

const HERO_IMG = '/src/assets/images/hero_invitation_desk_1795693433172.jpg';

const DEMO_SNAPSHOTS: Record<'wedding' | 'birthday' | 'puja', PublicInvitationSnapshot> = {
  wedding: {
    categorySlug: 'wedding',
    themeId: 'wedding-royal-red-gold',
    eventTitle: 'Ananya & Kabir',
    eventData: {
      brideName: 'Ananya Chatterjee',
      groomName: 'Kabir Malhotra',
      familyNames: 'The Chatterjee & Malhotra Families',
      eventDate: '2026-12-18',
      startTime: '19:00',
      endTime: '23:30',
      primaryVenue: 'Taj Bengal Courtyard, Kolkata',
      hostName: 'Mr. & Mrs. Subrata Chatterjee',
      dressCode: 'Traditional Silk & Heritage Formal',
      contactInfo: '+91 98300 00000',
    },
    invitationMessage:
      'With joyous hearts and the blessings of our elders, we invite you to celebrate the union of Ananya and Kabir over two days of music, rituals, and warm hospitality.',
    customization: {
      backgroundColor: '#2C0A12',
      cardColor: '#FBF7F0',
      accentColor: '#9E1B32',
      textColor: '#2A0810',
      fontChoice: 'cormorant',
      pattern: 'filigree',
      ornamentStyle: 'royal-arch',
      floralDecorations: true,
      reducedParticles: false,
      musicMood: 'harp-bliss',
    },
    settings: {
      rsvpEnabled: true,
      countdownEnabled: true,
      galleryEnabled: true,
      locationsEnabled: true,
      qrEnabled: true,
    },
    images: [
      {
        id: 'demo-1',
        imageUrl: '/src/assets/images/theme_wedding_royal_1795693433562.jpg',
        caption: 'Royal Wedding Suite',
        displayOrder: 0,
      },
      {
        id: 'demo-2',
        imageUrl: '/src/assets/images/theme_floral_romance_1795693433979.jpg',
        caption: 'Botanical Courtyard',
        displayOrder: 1,
      },
    ],
    schedules: [
      {
        id: 'sch-haldi',
        eventName: 'Haldi & Sangeet Morning',
        eventDate: '2026-12-17',
        startTime: '10:30',
        endTime: '14:30',
        description: 'Turmeric blessings followed by folk melodies and festive lunch.',
        displayOrder: 0,
        location: {
          venueName: 'The Garden Pavilion, Alipore',
          fullAddress: '34B Belvedere Road, Alipore',
          city: 'Kolkata',
          state: 'West Bengal',
          postalCode: '700027',
          latitude: 22.5333,
          longitude: 88.3324,
          googleMapsUrl: '',
          description: 'Valet parking at Main Courtyard Gate.',
        },
      },
      {
        id: 'sch-ceremony',
        eventName: 'Wedding Ceremony & Reception',
        eventDate: '2026-12-18',
        startTime: '19:00',
        endTime: '23:30',
        description: 'Shubho Drishti, Mala Badal, and Grand Dinner.',
        displayOrder: 1,
        location: {
          venueName: 'Taj Bengal Grand Ballroom',
          fullAddress: '34B Belvedere Road, Alipore',
          city: 'Kolkata',
          state: 'West Bengal',
          postalCode: '700027',
          latitude: 22.5349,
          longitude: 88.3338,
          googleMapsUrl: '',
          description: '',
        },
      },
    ],
    status: 'published',
  },
  birthday: {
    categorySlug: 'birthday',
    themeId: 'birthday-luxury-black-gold',
    eventTitle: "Aarav's 30th Soirée",
    eventData: {
      honoreeName: 'Aarav Sen',
      ageOrMilestone: 'Turning 30',
      eventDate: '2026-12-22',
      startTime: '20:00',
      primaryVenue: 'Skyline Terrace Lounge',
      hostName: 'Riya & Friends',
      dressCode: 'Black & Gold Cocktail',
    },
    invitationMessage:
      'Raise a glass with us for an evening of rooftop jazz, midnight cake, and great company celebrating three decades of Aarav.',
    customization: {
      backgroundColor: '#0D0D0F',
      cardColor: '#17171A',
      accentColor: '#D4AF37',
      textColor: '#FAF5E8',
      fontChoice: 'playfair',
      pattern: 'geometric',
      ornamentStyle: 'art-deco',
      floralDecorations: true,
      reducedParticles: false,
      musicMood: 'celebration-chime',
    },
    settings: {
      rsvpEnabled: true,
      countdownEnabled: true,
      galleryEnabled: false,
      locationsEnabled: true,
      qrEnabled: true,
    },
    images: [],
    schedules: [
      {
        id: 'sch-bday',
        eventName: 'Rooftop Cocktail & Dinner',
        eventDate: '2026-12-22',
        startTime: '20:00',
        endTime: '23:55',
        description: 'Live acoustic set starting at 8:30 PM.',
        displayOrder: 0,
        location: {
          venueName: 'Skyline Terrace Lounge',
          fullAddress: '18 Park Street',
          city: 'Kolkata',
          state: 'West Bengal',
          postalCode: '700071',
          latitude: 22.5513,
          longitude: 88.3523,
          googleMapsUrl: '',
          description: 'Take the private rooftop elevator from Lobby B.',
        },
      },
    ],
    status: 'published',
  },
  puja: {
    categorySlug: 'puja',
    themeId: 'puja-golden-temple',
    eventTitle: 'Sri Satyanarayan Puja & Prasad',
    eventData: {
      honoreeName: 'The Banerjee Family Residence',
      ageOrMilestone: 'Auspicious Morning Katha',
      eventDate: '2026-12-14',
      startTime: '09:30',
      primaryVenue: 'Shantiniketan Villa, Salt Lake',
      hostName: 'Anirban & Moumita Banerjee',
    },
    invitationMessage:
      'With reverence and warmth, we seek your gracious presence at our home for Sri Satyanarayan Puja, bhajan, and afternoon bhog prasad.',
    customization: {
      backgroundColor: '#382209',
      cardColor: '#FFF9EC',
      accentColor: '#B45309',
      textColor: '#341D07',
      fontChoice: 'playfair',
      pattern: 'mandala',
      ornamentStyle: 'temple-toran',
      floralDecorations: true,
      reducedParticles: false,
      musicMood: 'serene-flute',
    },
    settings: {
      rsvpEnabled: true,
      countdownEnabled: true,
      galleryEnabled: false,
      locationsEnabled: true,
      qrEnabled: false,
    },
    images: [],
    schedules: [
      {
        id: 'sch-puja',
        eventName: 'Puja Sankalp & Bhog Prasad',
        eventDate: '2026-12-14',
        startTime: '09:30',
        endTime: '13:30',
        description: 'Prasad will be served from 12:15 PM onwards.',
        displayOrder: 0,
        location: {
          venueName: 'Banerjee Residence',
          fullAddress: 'Sector II, Salt Lake',
          city: 'Kolkata',
          state: 'West Bengal',
          postalCode: '700091',
          latitude: 22.5867,
          longitude: 88.4171,
          googleMapsUrl: '',
          description: '',
        },
      },
    ],
    status: 'published',
  },
};

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  authError: string | null;
}

export function LandingPage({ onSignIn, authError }: LandingPageProps) {
  const [activeDemo, setActiveDemo] = useState<'wedding' | 'birthday' | 'puja' | null>(null);

  if (activeDemo) {
    return (
      <ReceiverInvitationExperience
        snapshot={DEMO_SNAPSHOTS[activeDemo]}
        guestName="Rahul Das"
        isFamilyInvitation={activeDemo === 'puja'}
        isPreview
        onClosePreview={() => setActiveDemo(null)}
      />
    );
  }

  const featuredThemes = [
    getThemeById('wedding-royal-red-gold'),
    getThemeById('wedding-floral-romance'),
    getThemeById('birthday-luxury-black-gold'),
    getThemeById('puja-golden-temple'),
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      {/* Hero Split */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <h1
              className="font-display font-semibold tracking-tight text-stone-900 leading-[1.08]"
              style={{
                fontSize: 'clamp(2.4rem, 4.2vw, 3.85rem)',
                textWrap: 'balance',
              }}
            >
              Tactile digital invitations crafted for every celebration.
            </h1>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
              Replace static PDFs with personalized animated envelopes, silk ribbon reveals, multi-venue Google Maps schedules, and one-tap WhatsApp sharing.
            </p>

            {authError && (
              <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2.5">
                {authError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => void onSignIn()}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827] transition-colors whitespace-nowrap"
              >
                <span>Create Your Invitation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveDemo('wedding')}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium bg-white border border-stone-300 text-stone-900 rounded-lg hover:bg-stone-50 transition-colors whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                <span>Open Sample Card</span>
              </button>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-500 border-t border-stone-200">
              <span>15 Event Categories</span>
              <span aria-hidden="true">·</span>
              <span>Unique Guest Links</span>
              <span aria-hidden="true">·</span>
              <span>No Login Required for Guests</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-stone-200 h-full min-h-[320px] lg:min-h-[440px]">
              <img
                src={HERO_IMG}
                alt="Handmade deckle-edge invitation suite with crimson wax seal and brass scissors"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Showcase */}
      <section
        id="demos"
        className="border-t border-stone-200 bg-[#F3F1EC] py-16 sm:py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-stone-900">
              Three distinct reveal ceremonies
            </h2>
            <p className="text-sm sm:text-base text-stone-600">
              Every occasion opens with its own tactile interaction—from wax-sealed wedding ribbons to confetti-popping birthday gift boxes and auspicious temple curtains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                key: 'wedding' as const,
                title: 'Royal Wedding Suite',
                meta: 'Envelope · Brass Scissors · Ribbon Cut',
                theme: featuredThemes[0],
              },
              {
                key: 'birthday' as const,
                title: 'Black & Gold 30th',
                meta: 'Gift Box Unwrap · Confetti Burst',
                theme: featuredThemes[2],
              },
              {
                key: 'puja' as const,
                title: 'Golden Temple Puja',
                meta: 'Ceremonial Curtain · Mandala Glow',
                theme: featuredThemes[3],
              },
            ].map((demo) => (
              <div
                key={demo.key}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col"
              >
                <div className="h-52 relative overflow-hidden">
                  <img
                    src={demo.theme.previewImage}
                    alt={demo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs opacity-90">{demo.meta}</p>
                    <h3 className="text-xl font-display font-semibold mt-0.5">
                      {demo.title}
                    </h3>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-stone-600">
                    Personalized for &ldquo;Dear Rahul Das&rdquo;
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveDemo(demo.key)}
                    className="px-3.5 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 whitespace-nowrap shrink-0"
                  >
                    Experience
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities & Categories */}
      <section id="categories" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-stone-900">
              Built for every milestone
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              From multi-day Indian weddings and Annaprashan ceremonies to corporate summits and custom events—create, personalize, and share in minutes.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Sparkles className="w-5 h-5 text-[#8B1E2F]" />
              <h3 className="text-sm font-semibold text-stone-900">
                01. Personalized Guest Links
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Every guest receives a unique URL greeting them or their family by name, with open tracking and CSV/Excel import.
              </p>
            </div>
            <div className="space-y-2">
              <MapPin className="w-5 h-5 text-[#8B1E2F]" />
              <h3 className="text-sm font-semibold text-stone-900">
                02. Multi-Venue Schedules
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Assign distinct Google Maps pins and one-tap navigation directions for Haldi, Sangeet, Ceremony, and Reception.
              </p>
            </div>
            <div className="space-y-2">
              <MessageCircle className="w-5 h-5 text-[#8B1E2F]" />
              <h3 className="text-sm font-semibold text-stone-900">
                03. WhatsApp &amp; Optional RSVP
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Share custom WhatsApp messages with one click, generate printable QR codes, and export guest RSVPs anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-200 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {BUILT_IN_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="px-4 py-3 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-800"
            >
              {cat.name}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <span className="font-display text-base font-semibold text-stone-900">
            Vellum
          </span>
          <span>Universal Interactive Digital Invitation Platform</span>
        </div>
      </footer>
    </div>
  );
}
