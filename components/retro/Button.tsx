import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'default' | 'mint' | 'coral' | 'sky' | 'gold' | 'lav' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'lg';
  block?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'default', size, block, className = '', children, ...rest }: Props) {
  const v = variant === 'default' ? '' : variant;
  const s = size ?? '';
  const b = block ? 'block' : '';
  return (
    <button className={`btn ${v} ${s} ${b} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
