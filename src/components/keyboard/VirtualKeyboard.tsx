'use client';

/**
 * VangaTypePanalam — Virtual Keyboard Component
 *
 * Full keyboard visualization matching Keybr's style:
 * - All rows including number row, modifiers, space bar
 * - Dual labels (shift character on top)
 * - Finger-color-coded backgrounds
 * - Highlights the next expected key
 */

import { useState, useEffect } from 'react';
import { QWERTY_LAYOUT, type KeyData } from '@/data/keyboards/qwerty';
import { TAMIL99_LAYOUT } from '@/data/keyboards/tamil99';
import { OW_TAMIL_LAYOUT, OW_SHIFT_VARIANT_TO_BASE } from '@/data/keyboards/owTamil';
import { QWERTY_TO_OW } from '@/data/keyboards/owTamilInputMap';
import { useTypingStore } from '@/store/typingStore';
import { useUIStore } from '@/store/uiStore';
import '@/styles/keyboard.css';

interface VirtualKeyboardProps {
  unlockedKeys?: string[];
  showFingerColors?: boolean;
  language?: string;
  heatmapData?: Map<string, { accuracy: number; frequency: number }>;
}

export default function VirtualKeyboard({
  unlockedKeys,
  showFingerColors = true,
  language = 'en',
  heatmapData,
}: VirtualKeyboardProps) {
  const snapshot = useTypingStore((s) => s.snapshot);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [flashState, setFlashState] = useState<{
    key: string;
    type: 'correct' | 'error';
  } | null>(null);

  // Expected key from the typing session
  const expectedKey =
    snapshot.text && snapshot.cursorPosition < snapshot.text.length
      ? snapshot.text[snapshot.cursorPosition]
      : null;

  const kbLayout = useUIStore((s) => s.keyboardLayout);

  const isOWTamil = language === 'ta' && kbLayout === 'phonetic';
  const layoutToUse = isOWTamil ? OW_TAMIL_LAYOUT : (language === 'ta' ? TAMIL99_LAYOUT : QWERTY_LAYOUT);

  // Listen for physical key presses for visual feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        let matchedKey: string;

        if (isOWTamil) {
          // OW: translate QWERTY key → Tamil char, then normalize to base key
          const tamilChar = QWERTY_TO_OW[e.key];
          matchedKey = tamilChar
            ? (OW_SHIFT_VARIANT_TO_BASE[tamilChar] ?? tamilChar)
            : e.key.toLowerCase();
        } else {
          matchedKey = e.key.toLowerCase();
        }

        setPressedKey(matchedKey);

        if (expectedKey) {
          const isCorrect = matchedKey === expectedKey;
          setFlashState({
            key: matchedKey,
            type: isCorrect ? 'correct' : 'error',
          });
          setTimeout(() => setFlashState(null), 200);
        }
      }
    };

    const handleKeyUp = () => {
      setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [expectedKey, isOWTamil]);

  const getKeyClassName = (keyData: KeyData): string => {
    const classes = ['key'];

    // Width class
    if (keyData.width && keyData.width !== 1) {
      classes.push('key-wide');
    }

    // Modifier keys get a muted style
    if (keyData.isModifier) {
      classes.push('key-modifier');
    }

    // Finger color
    if (showFingerColors && !keyData.isModifier) {
      classes.push(`finger-${keyData.finger}`);
    }

    // Space bar special style
    if (keyData.key === ' ') {
      classes.push('space-key');
      if (showFingerColors) {
        classes.push('finger-thumb');
      }
    }

    // Home row markers (F and J have bumps)
    if (keyData.key === 'f' || keyData.key === 'j') {
      classes.push('home-key');
    }

    // Highlight expected key (normalize for OW shift variants)
    if (expectedKey && !keyData.isModifier) {
      const matchKey = isOWTamil ? (OW_SHIFT_VARIANT_TO_BASE[expectedKey] ?? expectedKey) : expectedKey;
      if (keyData.key === matchKey) {
        classes.push('highlighted');
      }
    }

    // Pressed state
    if (pressedKey && keyData.key === pressedKey) {
      classes.push('pressed');
    }

    // Flash state
    if (flashState && flashState.key === keyData.key) {
      classes.push(
        flashState.type === 'correct' ? 'correct-flash' : 'error-flash'
      );
    }

    // Locked/unlocked for lessons (normalize for OW shift variants)
    if (unlockedKeys && !keyData.isModifier) {
      const normalizedUnlocked = isOWTamil
        ? unlockedKeys.map((k) => OW_SHIFT_VARIANT_TO_BASE[k] ?? k)
        : unlockedKeys;
      const isUnlocked = normalizedUnlocked.includes(keyData.key);
      if (!isUnlocked) {
        classes.push('locked');
      }
    }

    return classes.join(' ');
  };

  // Calculate inline width and heatmap styles for keys
  const getKeyStyle = (keyData: KeyData): React.CSSProperties | undefined => {
    const style: React.CSSProperties = {};
    
    // Width logic
    if (keyData.width && keyData.width !== 1) {
      // Each standard key = 44px, gap = 2px
      const baseWidth = 44;
      const gap = 2;
      const totalWidth = keyData.width * baseWidth + (keyData.width - 1) * gap;
      style.width = `${totalWidth}px`;
    }

    // Heatmap styling overlay
    if (heatmapData && !keyData.isModifier) {
      const stats = heatmapData.get(keyData.key.toLowerCase());
      // Only show heatmap color if we have at least 3 samples
      if (stats && stats.frequency >= 3) {
        const accPct = Math.round(stats.accuracy * 100);
        if (accPct < 70) {
          // Hot gradient (red/error area)
          const intensity = Math.min((70 - accPct) / 30, 1);
          style.backgroundColor = `rgba(248, 113, 113, ${0.1 + intensity * 0.4})`;
          style.boxShadow = `0 0 ${10 * intensity}px rgba(248, 113, 113, ${0.2 + intensity * 0.3})`;
          style.borderColor = `rgba(248, 113, 113, ${0.3 + intensity * 0.5})`;
        } else if (accPct >= 85) {
          // Warm gradient (gold/mastery area)
          const intensity = Math.min((accPct - 85) / 15, 1);
          style.backgroundColor = `rgba(238, 194, 36, ${0.1 + intensity * 0.3})`;
          style.boxShadow = `0 0 ${8 * intensity}px rgba(238, 194, 36, ${0.15 + intensity * 0.25})`;
          style.borderColor = `rgba(238, 194, 36, ${0.2 + intensity * 0.4})`;
        }
      }
    }

    return Object.keys(style).length > 0 ? style : undefined;
  };

  return (
    <div className="virtual-keyboard" role="img" aria-label="Virtual keyboard">
      {layoutToUse.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((keyData, keyIndex) => (
            <div
              key={`${keyData.key}-${keyIndex}`}
              className={getKeyClassName(keyData)}
              style={getKeyStyle(keyData)}
            >
              {/* Shift label (top-left small text) */}
              {keyData.shiftLabel && (
                <span className="key-shift-label">{keyData.shiftLabel}</span>
              )}
              {/* Main label */}
              <span className={keyData.shiftLabel ? 'key-main-label' : 'key-label-only'}>
                {keyData.label}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
