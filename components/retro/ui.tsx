import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Window, type TitleColor } from './Window';

export function Pill({ children, color = '' }: { children: ReactNode; color?: '' | 'mint' | 'sky' | 'gold' | 'coral' | 'lav' | 'gray' }) {
  return <span className={`pill ${color}`}>{children}</span>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint ? <span className="small muted">{hint}</span> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`textarea ${props.className ?? ''}`} />;
}

export function Spinner() {
  return <span className="spinner" aria-label="loading" />;
}

export function Thinking({ label = 'Thinking' }: { label?: string }) {
  return (
    <span className="thinking" role="status">
      <i />
      <i />
      <i />
      <span className="small muted" style={{ marginLeft: 6 }}>
        {label}…
      </span>
    </span>
  );
}

export function Empty({ icon = '🗂️', children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      {children}
    </div>
  );
}

/** Modal overlay; pass a Window (or any node) as children. */
export function Dialog({
  title,
  color = 'lav',
  icon,
  onClose,
  children,
  width = 520,
}: {
  title: ReactNode;
  color?: TitleColor;
  icon?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  width?: number;
}) {
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div style={{ width: '100%', maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <Window title={title} color={color} icon={icon} controls={false}>
          {children}
        </Window>
      </div>
    </div>
  );
}
