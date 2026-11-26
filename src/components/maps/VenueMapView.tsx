import React, { useEffect, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import {
  buildDirectionsUrl,
  buildOpenMapsUrl,
  formatDisplayDate,
  formatDisplayTime,
} from '../../lib/utils';
import type { EventScheduleItem } from '../../types/invitation';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function ActiveVenuePanner({
  lat,
  lng,
}: {
  lat: number | null;
  lng: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (map && lat !== null && lng !== null) {
      map.panTo({ lat, lng });
      map.setZoom(14);
    }
  }, [map, lat, lng]);
  return null;
}

function VenueMarkerWithWindow({
  schedule,
  accentColor,
  isSelected,
  onSelect,
}: {
  schedule: EventScheduleItem;
  accentColor: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isSelected) setOpen(true);
  }, [isSelected]);

  if (schedule.location.latitude === null || schedule.location.longitude === null) {
    return null;
  }

  const pos = {
    lat: schedule.location.latitude,
    lng: schedule.location.longitude,
  };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={pos}
        title={schedule.location.venueName || schedule.eventName}
        onClick={() => {
          onSelect();
          setOpen(true);
        }}
      >
        <Pin background={accentColor} borderColor="#1C1917" glyphColor="#FFFFFF" />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow anchor={marker} maxWidth={240} onCloseClick={() => setOpen(false)}>
          <div className="p-1 text-stone-900">
            <p className="font-semibold text-xs">{schedule.eventName}</p>
            <p className="text-xs text-stone-600 mt-0.5">{schedule.location.venueName}</p>
            {schedule.location.fullAddress && (
              <p className="text-[11px] text-stone-500 mt-1">{schedule.location.fullAddress}</p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface VenueMapViewProps {
  schedules: EventScheduleItem[];
  accentColor: string;
  cardSurface: string;
  primaryText: string;
  secondaryText: string;
  borderColor: string;
}

export function VenueMapView({
  schedules,
  accentColor,
  cardSurface,
  primaryText,
  secondaryText,
  borderColor,
}: VenueMapViewProps) {
  const validSchedules = schedules.filter(
    (s) =>
      s.location.venueName ||
      s.location.fullAddress ||
      (s.location.latitude !== null && s.location.longitude !== null)
  );

  const [selectedId, setSelectedId] = useState<string>(validSchedules[0]?.id || '');

  if (validSchedules.length === 0) return null;

  const activeItem =
    validSchedules.find((s) => s.id === selectedId) ?? validSchedules[0];

  const coordSchedules = validSchedules.filter(
    (s) => s.location.latitude !== null && s.location.longitude !== null
  );

  const initialCenter =
    activeItem.location.latitude !== null && activeItem.location.longitude !== null
      ? { lat: activeItem.location.latitude, lng: activeItem.location.longitude }
      : coordSchedules[0]
      ? {
          lat: coordSchedules[0].location.latitude as number,
          lng: coordSchedules[0].location.longitude as number,
        }
      : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {validSchedules.map((sch) => {
          const isSelected = sch.id === activeItem.id;
          const addressLine = [
            sch.location.fullAddress,
            sch.location.city,
            sch.location.state,
            sch.location.postalCode,
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <div
              key={sch.id}
              onClick={() => setSelectedId(sch.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedId(sch.id);
                }
              }}
              className="rounded-xl p-5 transition-transform duration-200 cursor-pointer"
              style={{
                backgroundColor: cardSurface,
                border: `1px solid ${isSelected ? accentColor : borderColor}`,
                color: primaryText,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: accentColor }}>
                    <span>{sch.eventName}</span>
                    {sch.eventDate && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{formatDisplayDate(sch.eventDate)}</span>
                      </>
                    )}
                    {sch.startTime && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {formatDisplayTime(sch.startTime)}
                          {sch.endTime ? ` – ${formatDisplayTime(sch.endTime)}` : ''}
                        </span>
                      </>
                    )}
                  </div>

                  <h4 className="text-lg font-display font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                    <span>{sch.location.venueName || 'Venue Details'}</span>
                  </h4>

                  {addressLine && (
                    <p className="text-sm leading-relaxed" style={{ color: secondaryText }}>
                      {addressLine}
                    </p>
                  )}
                  {(sch.description || sch.location.description) && (
                    <p className="text-xs italic" style={{ color: secondaryText }}>
                      {sch.location.description || sch.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                  <a
                    href={buildDirectionsUrl(sch.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium text-white whitespace-nowrap shrink-0 transition-opacity hover:opacity-90 min-h-[44px]"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                  </a>
                  <a
                    href={buildOpenMapsUrl(sch.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-opacity hover:opacity-80 min-h-[44px]"
                    style={{
                      border: `1px solid ${borderColor}`,
                      color: primaryText,
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Maps</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {GOOGLE_MAPS_API_KEY && initialCenter && (
        <div
          className="rounded-xl overflow-hidden h-72 w-full"
          style={{ border: `1px solid ${borderColor}` }}
        >
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker']}>
            <GoogleMap
              defaultCenter={initialCenter}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              gestureHandling="cooperative"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <ActiveVenuePanner
                lat={activeItem.location.latitude}
                lng={activeItem.location.longitude}
              />
              {coordSchedules.map((sch) => (
                <VenueMarkerWithWindow
                  key={sch.id}
                  schedule={sch}
                  accentColor={accentColor}
                  isSelected={sch.id === activeItem.id}
                  onSelect={() => setSelectedId(sch.id)}
                />
              ))}
            </GoogleMap>
          </APIProvider>
        </div>
      )}
    </div>
  );
}
