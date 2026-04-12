'use client';

/**
 * VaagaTypePanalam — Virtual Keyboard Component
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
import { useTypingStore } from '@/store/typingStore';
import '@/styles/keyboard.css';

interface VirtualKeyboardProps {
  unlockedKeys?: string[];
  showFingerColors?: boolean;
  language?: string;
}

export default function VirtualKeyboard({
  unlockedKeys,
  showFingerColors = true,
  language = 'en',
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

  // Listen for physical key presses for visual feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        setPressedKey(e.key.toLowerCase());

        if (expectedKey) {
          const isCorrect = e.key === expectedKey;
          setFlashState({
            key: e.key.toLowerCase(),
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
  }, [expectedKey]);

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

    // Highlight expected key
    if (expectedKey && !keyData.isModifier) {
      if (keyData.key === expectedKey.toLowerCase()) {
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

    // Locked/unlocked for lessons
    if (unlockedKeys && !keyData.isModifier) {
      const isUnlocked = unlockedKeys.includes(keyData.key);
      if (!isUnlocked) {
        classes.push('locked');
      }
    }

    return classes.join(' ');
  };

  const layoutToUse = language === 'ta' ? TAMIL99_LAYOUT : QWERTY_LAYOUT;

  // Calculate inline width style for keys
  const getKeyStyle = (keyData: KeyData): React.CSSProperties | undefined => {
    if (!keyData.width || keyData.width === 1) return undefined;
    // Each standard key = 44px, gap = 2px
    const baseWidth = 44;
    const gap = 2;
    const totalWidth = keyData.width * baseWidth + (keyData.width - 1) * gap;
    return { width: `${totalWidth}px` };
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
