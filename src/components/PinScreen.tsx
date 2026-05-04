import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import PinKeypad from './PinKeypad';
import { savePin, verifyPin } from '../utils/pinStorage';

interface PinScreenProps {
  mode: 'setup' | 'unlock';
  onSetupDone?: () => void;
  onUnlock?: () => void;
  onForgotPin?: () => void;
}

export default function PinScreen({ mode, onSetupDone, onUnlock, onForgotPin }: PinScreenProps) {
  const [value, setValue] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showError = (msg: string) => {
    setError(true);
    setErrorMsg(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setError(false);
      setValue('');
    }, 600);
  };

  const handleChange = async (newValue: string) => {
    setValue(newValue);
    if (newValue.length < 4) return;

    if (mode === 'unlock') {
      const ok = await verifyPin(newValue);
      if (ok) {
        onUnlock?.();
      } else {
        showError('PIN errato');
      }
      return;
    }

    // setup
    if (firstPin === null) {
      setFirstPin(newValue);
      setValue('');
      setErrorMsg('');
    } else {
      if (newValue === firstPin) {
        await savePin(newValue);
        onSetupDone?.();
      } else {
        setFirstPin(null);
        showError('PIN non corrispondono, riprova');
      }
    }
  };

  const handleForgotPin = () => {
    const confirmed = window.confirm(
      "Per sicurezza, l'unico modo per resettare il PIN è cancellare tutti i dati locali dell'app. " +
        'I dati sincronizzati con Supabase saranno comunque accessibili al riaccesso. Procedere?'
    );
    if (confirmed) {
      onForgotPin?.();
    }
  };

  const isConfirmStep = mode === 'setup' && firstPin !== null;

  const title =
    mode === 'unlock' ? 'App bloccata' : isConfirmStep ? 'Conferma PIN' : 'Imposta un PIN';

  const subtitle =
    mode === 'unlock'
      ? 'Inserisci il tuo PIN'
      : isConfirmStep
        ? 'Reinserisci lo stesso PIN'
        : 'Proteggi i dati delle campagne';

  return (
    <div style={styles.screen}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <span style={styles.lockIcon}>🔒</span>
          <div style={styles.title}>{title}</div>
          <div style={styles.subtitle}>{subtitle}</div>
          {errorMsg && <div style={styles.errorMsg}>{errorMsg}</div>}
        </div>

        <PinKeypad value={value} onChange={handleChange} error={error} />

        {mode === 'unlock' && (
          <button type="button" onClick={handleForgotPin} style={styles.forgotBtn}>
            Hai dimenticato il PIN?
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    position: 'fixed',
    inset: 0,
    background: 'var(--bg-app)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 40,
    paddingTop: 0,
    paddingRight: 24,
    paddingBottom: 0,
    paddingLeft: 24,
    width: '100%',
    maxWidth: 360,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 8,
    lineHeight: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--text-primary)',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 13,
    color: '#A32D2D',
    textAlign: 'center',
    marginTop: 4,
    minHeight: 18,
  },
  forgotBtn: {
    background: 'transparent',
    borderWidth: 0,
    borderStyle: 'solid',
    color: 'var(--accent)',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    textDecoration: 'underline',
  },
};
