'use client';

import { useCallback, useState } from 'react';
import exifr from 'exifr';
import { useI18n } from '@/lib/i18n';
import type { LatLng } from './MapPicker';

const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4';
const MAX_MB = 25;
const MAX_FILES = 8;

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  onGps?: (gps: LatLng) => void;
}

interface Preview {
  url: string;
  isVideo: boolean;
  name: string;
}

export function PhotoUpload({ files, onChange, onGps }: Props) {
  const { lang } = useI18n();
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (incoming: FileList | null) => {
      if (!incoming) return;
      setError(null);
      const list = Array.from(incoming);

      const tooBig = list.find((f) => f.size > MAX_MB * 1024 * 1024);
      if (tooBig) {
        setError(lang === 'ka'
          ? `"${tooBig.name}" აჭარბებს ${MAX_MB} MB-ის ლიმიტს.`
          : `"${tooBig.name}" exceeds the ${MAX_MB} MB limit.`
        );
        return;
      }
      const combined = [...files, ...list].slice(0, MAX_FILES);
      onChange(combined);

      setPreviews(
        combined.map((f) => ({
          url: URL.createObjectURL(f),
          isVideo: f.type.startsWith('video/'),
          name: f.name,
        })),
      );

      const firstImage = list.find((f) => f.type.startsWith('image/'));
      if (firstImage && onGps) {
        try {
          const gps = await exifr.gps(firstImage);
          if (gps && typeof gps.latitude === 'number') {
            onGps({ lat: gps.latitude, lng: gps.longitude });
          }
        } catch {
          /* EXIF optional */
        }
      }
    },
    [files, onChange, onGps, lang],
  );

  const remove = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
    setPreviews(
      next.map((f) => ({ url: URL.createObjectURL(f), isVideo: f.type.startsWith('video/'), name: f.name })),
    );
  };

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center hover:border-brand-500">
        <span className="text-3xl">📷</span>
        <span className="mt-2 text-sm font-medium text-slate-700">
          {lang === 'ka' ? 'დააჭირეთ ფოტოს ან ვიდეოს დასამატებლად' : 'Tap to add photos (or a video)'}
        </span>
        <span className="mt-1 text-xs text-slate-500">
          {lang === 'ka'
            ? `JPEG/PNG/WebP ან MP4 · მაქსიმუმ ${MAX_FILES} ფაილი · თითო მაქს. ${MAX_MB} MB`
            : `JPEG/PNG/WebP or MP4 · up to ${MAX_FILES} files · max ${MAX_MB} MB each`
          }
        </span>
        <input
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((p, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg border border-slate-200">
              {p.isVideo ? (
                <video src={p.url} className="h-24 w-full object-cover" />
              ) : (
                <img src={p.url} alt={p.name} className="h-24 w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white opacity-0 transition group-hover:opacity-100"
                aria-label={lang === 'ka' ? 'წაშლა' : 'Remove'}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}