import type { ReactNode } from 'react';

export type TitleColor = 'sky' | 'mint' | 'coral' | 'gold' | 'lav' | 'pink' | 'teal';

export function Window({
  title,
  color = 'sky',
  icon,
  controls = true,
  children,
  className = '',
  bodyClass = '',
}: {
  title: ReactNode;
  color?: TitleColor;
  icon?: ReactNode;
  controls?: boolean;
  children: ReactNode;
  className?: string;
  bodyClass?: string;
}) {
  return (
    <div className={`window ${className}`}>
      <div className={`titlebar ${color}`}>
        <span className="tb-title">
          {icon ? <span aria-hidden>{icon}</span> : null}
          {title}
        </span>
        {controls ? (
          <span className="tb-controls" aria-hidden>
            <i className="dot">–</i>
            <i className="dot">▢</i>
            <i className="dot">✕</i>
          </span>
        ) : null}
      </div>
      <div className={`window-body ${bodyClass}`}>{children}</div>
    </div>
  );
}
