import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { compressImageToDataUrl, generateId } from '../../lib/utils';
import type { InvitationImage } from '../../types/invitation';

interface PhotoGalleryStepProps {
  images: InvitationImage[];
  galleryEnabled: boolean;
  onChangeImages: (next: InvitationImage[]) => void;
  onToggleGallery: (enabled: boolean) => void;
}

const MAX_IMAGES = 5;

export function PhotoGalleryStep({
  images,
  galleryEnabled,
  onChangeImages,
  onToggleGallery,
}: PhotoGalleryStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setError('Maximum limit of 5 photographs reached.');
      return;
    }

    const files = Array.from(fileList).slice(0, remainingSlots);
    if (fileList.length > remainingSlots) {
      setError(`Only ${remainingSlots} slot(s) remaining (5 photos max). Extra files were skipped.`);
    }

    const added: InvitationImage[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const dataUrl = await compressImageToDataUrl(files[i], (pct) => {
          setProgress(Math.round(((i + pct / 100) / files.length) * 100));
        });
        added.push({
          id: generateId('img'),
          imageUrl: dataUrl,
          caption: '',
          displayOrder: images.length + added.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process image.');
      }
    }

    setProgress(null);
    if (added.length > 0) {
      onChangeImages([...images, ...added].slice(0, MAX_IMAGES));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReplaceFile = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !replacingId) return;
    setError(null);
    try {
      const dataUrl = await compressImageToDataUrl(fileList[0], setProgress);
      onChangeImages(
        images.map((img) =>
          img.id === replacingId ? { ...img, imageUrl: dataUrl } : img
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace image.');
    } finally {
      setProgress(null);
      setReplacingId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const moveImage = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onChangeImages(copy.map((img, i) => ({ ...img, displayOrder: i })));
  };

  const removeImage = (id: string) => {
    onChangeImages(
      images
        .filter((img) => img.id !== id)
        .map((img, i) => ({ ...img, displayOrder: i }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-stone-900">
            Pre-Event Photographs
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Upload up to 5 photographs (JPG, PNG, or WebP). Images are automatically optimized for fast mobile loading.
          </p>
        </div>

        <label className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-800 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={galleryEnabled}
            onChange={(e) => onToggleGallery(e.target.checked)}
            className="w-4 h-4 accent-[#8B1E2F] rounded"
          />
          <span>Show gallery on invitation</span>
        </label>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white border border-dashed border-stone-300 rounded-xl p-6 text-center space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void handleFilesSelected(e.target.files)}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void handleReplaceFile(e.target.files)}
        />

        <div className="w-11 h-11 rounded-full bg-stone-100 text-stone-700 mx-auto flex items-center justify-center">
          <ImagePlus className="w-5 h-5" />
        </div>

        <div>
          <p className="text-sm font-medium text-stone-900 tabular-nums">
            {images.length} / {MAX_IMAGES} Photographs Uploaded
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Recommended: couple portraits, family milestones, or celebration highlights.
          </p>
        </div>

        <button
          type="button"
          disabled={images.length >= MAX_IMAGES || progress !== null}
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-45 transition-colors"
        >
          {images.length >= MAX_IMAGES ? '5-Photo Limit Reached' : 'Select Photographs'}
        </button>

        {progress !== null && (
          <div className="max-w-xs mx-auto space-y-1">
            <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B1E2F] transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 tabular-nums">
              Optimizing image... {progress}%
            </p>
          </div>
        )}

        {error && <p className="text-xs text-rose-700">{error}</p>}
      </div>

      {/* Uploaded Horizontal Previews */}
      {images.length > 0 && (
        <div className="flex flex-row gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="snap-start shrink-0 w-72 bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-stone-100 relative">
                <img
                  src={img.imageUrl}
                  alt={img.caption || `Uploaded photograph ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 space-y-2.5">
                <input
                  type="text"
                  value={img.caption}
                  maxLength={120}
                  onChange={(e) =>
                    onChangeImages(
                      images.map((item) =>
                        item.id === img.id ? { ...item, caption: e.target.value } : item
                      )
                    )
                  }
                  placeholder={`Caption for photo ${idx + 1} (optional)`}
                  className="w-full px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#8B1E2F]"
                />
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, -1)}
                      aria-label="Move photo up"
                      className="p-1.5 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-35"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => moveImage(idx, 1)}
                      aria-label="Move photo down"
                      className="p-1.5 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-35"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setReplacingId(img.id);
                        replaceInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-700 border border-stone-200 rounded-md hover:bg-stone-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      aria-label="Delete photograph"
                      className="p-1.5 rounded-md border border-stone-200 text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
