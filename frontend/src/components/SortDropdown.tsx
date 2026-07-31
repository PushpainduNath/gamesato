'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import styles from './SortDropdown.module.css';

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  value: string;
  onChange: (newValue: string) => void;
  options?: SortOption[];
}

const DEFAULT_OPTIONS: SortOption[] = [
  { value: 'new', label: 'New games' },
  { value: 'popular', label: 'Popular games' },
  { value: 'likes', label: 'Most liked' },
];

export default function SortDropdown({ value, onChange, options = DEFAULT_OPTIONS }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdownContainer} ref={containerRef}>
      {/* Figma 1:1 SortDropdown Trigger Button */}
      <button 
        type="button" 
        className={`${styles.dropdownBtn} ${isOpen ? styles.dropdownBtnOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <ArrowUpDown size={16} className={styles.sortIcon} />
        <span className={styles.sortLabel}>Sort by:</span>
        <span className={styles.sortValue}>{selectedOption.label}</span>
        <ChevronDown size={18} className={`${styles.chevronIcon} ${isOpen ? styles.chevronIconRotate : ''}`} />
      </button>

      {/* Custom Theme Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdownMenu}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.menuItem} ${isSelected ? styles.menuItemActive : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={16} className={styles.checkIcon} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
