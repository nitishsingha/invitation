import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Link2, MapPin, Search } from 'lucide-react';
import { parseGoogleMapsUrl } from '../../lib/utils';
import type { EventLocationData } from '../../types/invitation';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function triggerQuotaBannerIfExhausted(err: unknown) {
  const text = err instanceof Error ? err.message : String(err);
  if (
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('OVER_QUERY_LIMIT') ||
    text.includes('429')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

function MapViewportSync({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && lat !== null && lng !== null) {
      map.setCenter({ lat, lng });
      map.setZoom(15);
    }
  }, [map, lat, lng]);
  return null;
}

function PlacesSearchInner({
  onSelectLocation,
}: {
  onSelectLocation: (partial: Partial<EventLocationData>) => void;
}) {
  const placesLib = useMapsLibrary('places');
  type PlacesLib = NonNullable<typeof placesLib>;
  type AutocompleteSuggestionItem = Awaited<
    ReturnType<PlacesLib['AutocompleteSuggestion']['fetchAutocompleteSuggestions']>
  >['suggestions'][number];
  type SessionTokenInstance = InstanceType<PlacesLib['AutocompleteSessionToken']>;

  const [queryText, setQueryText] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const sessionTokenRef = useRef<SessionTokenInstance | null>(null);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = queryText.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      }
      setIsSearching(true);
      setSearchError(null);
      placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmed,
        sessionToken: sessionTokenRef.current,
      })
        .then((res: { suggestions?: AutocompleteSuggestionItem[] }) => {
          setSuggestions(res.suggestions ?? []);
        })
        .catch((err: unknown) => {
          triggerQuotaBannerIfExhausted(err);
          setSearchError('Unable to fetch venue suggestions right now.');
          setSuggestions([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [placesLib, queryText]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: AutocompleteSuggestionItem) => {
      if (!suggestion.placePrediction) return;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: [
            'displayName',
            'formattedAddress',
            'addressComponents',
            'location',
            'googleMapsURI',
          ],
        });

        let city = '';
        let state = '';
        let postalCode = '';
        for (const comp of place.addressComponents ?? []) {
          if (comp.types.includes('locality')) {
            city = comp.longText || '';
          } else if (comp.types.includes('administrative_area_level_1')) {
            state = comp.longText || '';
          } else if (comp.types.includes('postal_code')) {
            postalCode = comp.longText || '';
          }
        }

        const lat = place.location ? place.location.lat() : null;
        const lng = place.location ? place.location.lng() : null;

        onSelectLocation({
          venueName: place.displayName || suggestion.placePrediction.text.text,
          fullAddress: place.formattedAddress || suggestion.placePrediction.text.text,
          city,
          state,
          postalCode,
          latitude: lat,
          longitude: lng,
          googleMapsUrl:
            place.googleMapsURI ||
            (lat !== null && lng !== null
              ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
              : ''),
        });

        setQueryText('');
        setSuggestions([]);
        sessionTokenRef.current = null;
      } catch (err) {
        triggerQuotaBannerIfExhausted(err);
        setSearchError('Could not load details for that venue.');
      }
    },
    [onSelectLocation]
  );

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Search venue, banquet hall, hotel, or street address..."
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
        />
      </div>

      {isSearching && (
        <p className="mt-1.5 text-xs text-stone-500">Searching places...</p>
      )}
      {searchError && (
        <p className="mt-1.5 text-xs text-rose-700">{searchError}</p>
      )}

      {suggestions.length > 0 && (
        <ul className="mt-1.5 bg-white border border-stone-200 rounded-lg shadow-lg divide-y divide-stone-100 max-h-56 overflow-y-auto z-20 relative">
          {suggestions.map((s, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => void handleSelectSuggestion(s)}
                className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-stone-50 flex items-start gap-2.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#8B1E2F] shrink-0 mt-0.5" />
                <span className="text-stone-800 leading-snug">
                  {s.placePrediction?.text.text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface LocationPickerProps {
  value: EventLocationData;
  onChange: (next: EventLocationData) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [mapsUrlInput, setMapsUrlInput] = useState(value.googleMapsUrl || '');
  const [urlMessage, setUrlMessage] = useState<string | null>(null);

  const handleApplyPartial = useCallback(
    (partial: Partial<EventLocationData>) => {
      const next: EventLocationData = {
        ...value,
        ...partial,
      };
      onChange(next);
      if (partial.googleMapsUrl) {
        setMapsUrlInput(partial.googleMapsUrl);
      }
    },
    [value, onChange]
  );

  const handleParseUrl = () => {
    if (!mapsUrlInput.trim()) {
      setUrlMessage('Paste a valid Google Maps link first.');
      return;
    }
    const parsed = parseGoogleMapsUrl(mapsUrlInput);
    if (parsed.latitude === null && !parsed.venueHint) {
      onChange({ ...value, googleMapsUrl: mapsUrlInput.trim() });
      setUrlMessage('Link saved. You can also enter address or coordinates below.');
      return;
    }
    onChange({
      ...value,
      googleMapsUrl: mapsUrlInput.trim(),
      latitude: parsed.latitude ?? value.latitude,
      longitude: parsed.longitude ?? value.longitude,
      venueName: value.venueName || parsed.venueHint || value.venueName,
    });
    setUrlMessage(
      parsed.latitude !== null
        ? `Coordinates extracted (${parsed.latitude.toFixed(4)}, ${parsed.longitude?.toFixed(4)}).`
        : 'Venue title extracted from link.'
    );
  };

  const hasCoordinates = value.latitude !== null && value.longitude !== null;
  const mapCenter = hasCoordinates
    ? { lat: value.latitude as number, lng: value.longitude as number }
    : { lat: 22.5726, lng: 88.3639 };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-600">
            Method 1: Search Venue via Google Places
          </label>
          {GOOGLE_MAPS_API_KEY ? (
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker']}>
              <PlacesSearchInner onSelectLocation={handleApplyPartial} />
            </APIProvider>
          ) : (
            <div className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5">
              Places Autocomplete activates when your Google Maps key is present; use Method 2 or enter address fields below.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-600">
            Method 2: Paste Google Maps Location URL
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                value={mapsUrlInput}
                onChange={(e) => {
                  setMapsUrlInput(e.target.value);
                  onChange({ ...value, googleMapsUrl: e.target.value });
                }}
                placeholder="https://maps.google.com/?q=..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
              />
            </div>
            <button
              type="button"
              onClick={handleParseUrl}
              className="px-3.5 py-2.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 whitespace-nowrap shrink-0 transition-colors"
            >
              Extract Pin
            </button>
          </div>
          {urlMessage && <p className="text-xs text-stone-600">{urlMessage}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Venue Name</label>
          <input
            type="text"
            value={value.venueName}
            onChange={(e) => onChange({ ...value, venueName: e.target.value })}
            placeholder="e.g., Taj Bengal Ballroom"
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Full Street Address</label>
          <input
            type="text"
            value={value.fullAddress}
            onChange={(e) => onChange({ ...value, fullAddress: e.target.value })}
            placeholder="34B Belvedere Rd, Alipore"
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">City</label>
            <input
              type="text"
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder="Kolkata"
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">State</label>
            <input
              type="text"
              value={value.state}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              placeholder="WB"
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">PIN Code</label>
            <input
              type="text"
              value={value.postalCode}
              onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
              placeholder="700027"
              className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={value.latitude ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  latitude: e.target.value === '' ? null : Number.parseFloat(e.target.value),
                })
              }
              placeholder="22.5333"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={value.longitude ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  longitude: e.target.value === '' ? null : Number.parseFloat(e.target.value),
                })
              }
              placeholder="88.3324"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">
          Location Notes / Parking Instructions (Optional)
        </label>
        <input
          type="text"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="Valet parking available at Gate 2"
          className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1E2F]/20 focus:border-[#8B1E2F]"
        />
      </div>

      {GOOGLE_MAPS_API_KEY && hasCoordinates && (
        <div className="rounded-xl overflow-hidden border border-stone-200 h-56 w-full">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker']}>
            <GoogleMap
              defaultCenter={mapCenter}
              defaultZoom={15}
              mapId="DEMO_MAP_ID"
              gestureHandling="cooperative"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <MapViewportSync lat={value.latitude} lng={value.longitude} />
              <AdvancedMarker position={mapCenter} title={value.venueName || 'Event Venue'}>
                <Pin background="#8B1E2F" borderColor="#5E121E" glyphColor="#FFFFFF" />
              </AdvancedMarker>
            </GoogleMap>
          </APIProvider>
        </div>
      )}
    </div>
  );
}
