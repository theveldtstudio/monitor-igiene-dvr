import { useEffect, useRef } from 'react';
import type React from 'react';

interface PinKeypadProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function PinKeypad({ value, onChange, error = false }: PinKeypadProps) {
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const styleId = 'pin-keypad-styles';
    if (document.getElementById(styleId)) return;
    const el = document.createElement('style');
    el.id = styleId;
    el.textContent = `
      @keyframes pin-shake {
        0%,  100% { transform: translateX(0);   }
        20%        { transform: translateX(-8px); }
        40%        { transform: translateX(8px);  }
        60%        { transform: translateX(-8px); }
        80%        { transform: translateX(8px);  }
      }
    `;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    if (!error || !dotsRef.current) return;
    const el = dotsRef.current;
    el.style.animation = 'none';
    void el.offsetHeight; // force reflow so animation restarts
    el.style.animation = 'pin-shake 0.4s ease';
  }, [error]);

  const handleKey = (key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1));
    } else if (value.length < 4) {
      onChange(value + key);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div ref={dotsRef} style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: error ? '#A32D2D' : 'var(--accent)',
              backgroundColor:
                i < value.length
                  ? error
                    ? '#A32D2D'
                    : 'var(--accent)'
                  : 'transparent',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
          />
        ))}
      </div>

      <div style={styles.grid}>
        {KEYS.map((key, idx) => {
          if (key === '') {
            return <div key={idx} style={styles.keyEmpty} />;
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleKey(key)}
              style={styles.keyBtn}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
  },
  dotsRow: {
    display: 'flex',
    gap: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 64px)',
    gap: 12,
  },
  keyBtn: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    borderWidth: 0,
    borderStyle: 'solid',
    background: 'var(--bg-card)',
    fontSize: 24,
    fontWeight: 400,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
  },
  keyEmpty: {
    width: 64,
    height: 64,
  },
};
