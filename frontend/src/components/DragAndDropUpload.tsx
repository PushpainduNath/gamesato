'use client';

import React, { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import styles from './DragAndDropUpload.module.css';

interface DragAndDropUploadProps {
  id: string;
  accept?: string;
  label: string;
  sublabel?: string;
  required?: boolean;
  selectedFile: File | null;
  currentPreviewUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  onClearCurrent?: () => void;
}

export default function DragAndDropUpload({
  id,
  accept = 'image/*',
  label,
  sublabel,
  required = false,
  selectedFile,
  currentPreviewUrl,
  onFileSelect,
  onClearCurrent
}: DragAndDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onFileSelect(droppedFile);
      e.dataTransfer.clearData();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const isImage = accept.includes('image') || (selectedFile && selectedFile.type.startsWith('image/'));

  return (
    <div className={styles.container}>
      {label && (
        <div className={styles.headerLabel}>
          <span>{label}</span>
          {required && <span className={styles.requiredAsterisk}>*</span>}
        </div>
      )}

      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${selectedFile || currentPreviewUrl ? styles.hasFile : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          id={id}
          accept={accept}
          className={styles.hiddenInput}
          onChange={handleChange}
        />

        {selectedFile ? (
          <div className={styles.fileSelectedInfo}>
            {isImage ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Upload preview"
                className={styles.imagePreview}
              />
            ) : (
              <File size={24} className={styles.fileIcon} />
            )}
            <div className={styles.fileDetails}>
              <span className={styles.fileName} title={selectedFile.name}>{selectedFile.name}</span>
              <span className={styles.fileSize}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <button type="button" className={styles.removeBtn} onClick={handleRemove} title="Remove file">
              <X size={14} />
            </button>
          </div>
        ) : currentPreviewUrl ? (
          <div className={styles.fileSelectedInfo}>
            {isImage ? (
              <img
                src={currentPreviewUrl.startsWith('http') ? currentPreviewUrl : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022'}${currentPreviewUrl}`}
                alt="Current file"
                className={styles.imagePreview}
              />
            ) : (
              <File size={24} className={styles.fileIcon} />
            )}
            <div className={styles.fileDetails}>
              <span className={styles.fileName}>Current File Saved</span>
              <span className={styles.fileSize} style={{ color: '#34d399' }}>Drag & drop to replace</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div className={styles.changeBadge}>
                <Upload size={12} /> Replace
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect(null);
                  if (onClearCurrent) onClearCurrent();
                }}
                title="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.placeholderContent}>
            <div className={styles.iconCircle}>
              <Upload size={16} className={styles.uploadIcon} />
            </div>
            <div className={styles.placeholderText}>
              <span className={styles.mainText}>
                <strong>Drag & drop file</strong> or browse
              </span>
              {sublabel && <span className={styles.subText}>{sublabel}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
