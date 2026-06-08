'use client';

/**
 * Interactive location picker built on react-leaflet. Click the map to drop a
 * marker; the chosen coordinates are reported via onChange. When `value` changes
 * externally (e.g. GPS extracted from a photo) the view recenters.
 *
 * Import this with next/dynamic({ ssr: false }) — Leaflet needs `window`.
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons (Leaflet expects asset paths that bundlers break).
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
}

function ClickHandler({ onChange }: { onChange: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
  }, [value, map]);
  return null;
}

export default function MapPicker({ value, onChange }: Props) {
  // Default view: a neutral world-ish center until the user picks or GPS resolves.
  const center: [number, number] = value ? [value.lat, value.lng] : [41.7151, 44.8271];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300">
      <MapContainer center={center} zoom={value ? 15 : 12} style={{ height: 320, width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        <Recenter value={value} />
        {value && <Marker position={[value.lat, value.lng]} icon={icon} />}
      </MapContainer>
    </div>
  );
}
