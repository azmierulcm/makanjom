'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Loader2, X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface ImageUploadProps {
  /** Current image URL (shows preview) */
  value?: string | null;
  /** Called with the new public URL after a successful upload, or '' on clear */
  onChange: (url: string) => void;
  /** Storage bucket name – defaults to 'makanjom-uploads' */
  bucket?: string;
  /**
   * Path prefix inside the bucket, e.g. 'menu-items' or 'payment-proofs'.
   * File is stored at: <prefix>/<uid>/<timestamp>.<ext>
   */
  folder?: string;
  label?: string;
  /** Show a compact inline thumbnail instead of the tall drop-zone */
  compact?: boolean;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  bucket = 'makanjom-uploads',
  folder = 'uploads',
  label = 'Upload Image',
  compact = false,
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? 'anon';
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${folder}/${uid}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
  };

  // ── Compact mode: thumbnail strip for menu items ──
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="relative w-16 h-16 rounded-2xl overflow-hidden bg-neutral-50 border-2 border-dashed border-neutral-200 flex items-center justify-center cursor-pointer hover:border-[#ff385c]/40 hover:bg-[#ff385c]/5 transition-all"
        >
          {uploading ? (
            <Loader2 size={20} className="text-[#ff385c] animate-spin" />
          ) : value ? (
            <>
              <Image src={value} alt="Preview" fill className="object-cover" sizes="64px" />
              <button
                onClick={clear}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center text-neutral-600 hover:text-red-500 z-10"
              >
                <X size={10} />
              </button>
            </>
          ) : (
            <ImageIcon size={20} className="text-neutral-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">
            {label}
          </p>
          <p className="text-[10px] text-neutral-400">JPEG / PNG / WebP · max 5 MB</p>
          {error && <p className="text-[10px] text-red-500 font-bold mt-0.5">{error}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleChange}
        />
      </div>
    );
  }

  // ── Full drop-zone mode ──
  return (
    <div className={`space-y-2 ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative w-full rounded-[1.5rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden
          ${value
            ? 'border-neutral-200 bg-neutral-50'
            : 'border-neutral-200 bg-neutral-50 hover:border-[#ff385c]/40 hover:bg-[#ff385c]/5'
          }`}
        style={{ minHeight: value ? '180px' : '140px' }}
      >
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 gap-3">
            <Loader2 size={28} className="text-[#ff385c] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Uploading…</p>
          </div>
        )}

        {value && !uploading ? (
          <>
            <div className="relative w-full" style={{ minHeight: '180px' }}>
              <Image src={value} alt="Uploaded" fill className="object-cover rounded-[1.4rem]" sizes="(max-width: 768px) 100vw, 600px" />
            </div>
            <button
              onClick={clear}
              className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-neutral-600 hover:text-red-500 z-10 transition-colors"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent rounded-b-[1.4rem]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Click to replace</p>
            </div>
          </>
        ) : !uploading ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
              <Upload size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-700">{label}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Drag & drop or click to browse</p>
              <p className="text-[10px] text-neutral-300 mt-1">JPEG / PNG / WebP · max 5 MB</p>
            </div>
          </div>
        ) : null}
      </div>

      {error && (
        <p className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-[11px] font-bold text-red-600">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
}
