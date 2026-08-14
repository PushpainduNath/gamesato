'use client';

import React from 'react';
import { RotateCw } from 'lucide-react';
import styles from './OrientationRotateOverlay.module.css';

interface OrientationRotateOverlayProps {
  requiredOrientation: 'LANDSCAPE' | 'PORTRAIT';
  onForceRotate?: () => void;
}

export default function OrientationRotateOverlay({
  requiredOrientation,
  onForceRotate,
}: OrientationRotateOverlayProps) {
  const isLandscapeRequired = requiredOrientation === 'LANDSCAPE';

  return (
    <div className={styles.overlayContainer}>
      <div className={styles.iconWrapper}>
        <div className={styles.phoneIcon}>
          <div className={styles.phoneScreen} />
        </div>
      </div>

      <h3 className={styles.title}>
        {isLandscapeRequired ? 'Rotate to Landscape' : 'Rotate to Portrait'}
      </h3>

      <p className={styles.description}>
        {isLandscapeRequired
          ? 'This game is best played horizontally. Please rotate your device to landscape mode.'
          : 'This game is best played vertically. Please rotate your device to portrait mode.'}
      </p>

      {onForceRotate && (
        <div className={styles.actionsGroup}>
          <button onClick={onForceRotate} className={styles.forceRotateBtn}>
            <RotateCw size={18} />
            Force Rotate Screen
          </button>
        </div>
      )}
    </div>
  );
}
