'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, File, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFileSize?: number; // in bytes, default 10MB
  acceptedTypes?: string[];
  maxFiles?: number;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPTED = ['image/*', 'application/pdf', 'text/*', '.txt', '.md', '.json', '.csv'];

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return Image;
  if (file.type === 'application/pdf') return FileText;
  return File;
}

export function FileUpload({
  onFilesSelected,
  maxFileSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED,
  maxFiles = 5,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList).slice(0, maxFiles);
    const newPreviews: FilePreview[] = files.map((file) => {
      const id = Math.random().toString(36).slice(2, 10);
      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined;
      return { file, id, preview, status: 'pending', progress: 0 };
    });
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, maxFiles));
    onFilesSelected(files);
  }, [maxFiles, onFilesSelected]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset for re-selection
    }
  }, [processFiles]);

  const removeFile = useCallback((id: string) => {
    setPreviews((prev) => {
      const fp = prev.find((p) => p.id === id);
      if (fp?.preview) URL.revokeObjectURL(fp.preview);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const simulateUpload = useCallback((id: string) => {
    setPreviews((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'uploading' as const, progress: 0 } : p)),
    );
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setPreviews((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'complete' as const, progress: 100 } : p)),
        );
      } else {
        setPreviews((prev) =>
          prev.map((p) => (p.id === id ? { ...p, progress: Math.min(progress, 99) } : p)),
        );
      }
    }, 200);
  }, []);

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-[var(--accent)] bg-[var(--accent-muted)] scale-[1.02]'
            : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg-tertiary)]'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          aria-label="Upload files"
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className={`w-8 h-8 ${isDragging ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
          <p className="text-sm text-[var(--text)]">
            {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Images, PDFs, text files · Max {Math.round(maxFileSize / 1024 / 1024)}MB · Up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* File previews */}
      {previews.length > 0 && (
        <div className="mt-3 space-y-2">
          {previews.map((fp) => {
            const Icon = getFileIcon(fp.file);
            return (
              <div
                key={fp.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]"
              >
                {/* Thumbnail or icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
                  {fp.preview ? (
                    <img src={fp.preview} alt={fp.file.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text)] truncate">{fp.file.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {fp.file.size < 1024 * 1024
                      ? `${(fp.file.size / 1024).toFixed(1)} KB`
                      : `${(fp.file.size / 1024 / 1024).toFixed(1)} MB`}
                  </p>

                  {/* Progress bar */}
                  {fp.status === 'uploading' && (
                    <div className="mt-1 h-1 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                        style={{ width: `${fp.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {fp.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />}
                  {fp.status === 'error' && <AlertCircle className="w-4 h-4 text-[var(--error)]" />}
                  {fp.status === 'uploading' && (
                    <span className="text-[10px] text-[var(--text-muted)]">{Math.round(fp.progress)}%</span>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(fp.id);
                  }}
                  className="flex-shrink-0 p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                  aria-label={`Remove ${fp.file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
