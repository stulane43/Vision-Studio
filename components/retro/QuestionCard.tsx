'use client';

import type { Answer, Question } from '@/lib/engine/types';

export function QuestionCard({
  q,
  index,
  answer,
  onChange,
}: {
  q: Question;
  index: number;
  answer: Answer;
  onChange: (a: Answer) => void;
}) {
  const toggle = (key: string) => {
    let keys: string[];
    if (q.multi) {
      keys = answer.selectedKeys.includes(key)
        ? answer.selectedKeys.filter((k) => k !== key)
        : [...answer.selectedKeys, key];
    } else {
      keys = [key];
    }
    onChange({ ...answer, selectedKeys: keys });
  };

  return (
    <div className="question">
      <div className="q-head">
        <span className="q-num">{index + 1}</span>
        <span className="q-text">{q.text}</span>
      </div>
      <div className="choices">
        {q.options.map((opt) => {
          const selected = answer.selectedKeys.includes(opt.key);
          return (
            <div
              key={opt.key}
              className={`choice ${selected ? 'selected' : ''}`}
              onClick={() => toggle(opt.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(opt.key);
                }
              }}
            >
              <span className="ch-key">{opt.key}</span>
              <span className="grow">{opt.label}</span>
              {opt.isOther && selected ? (
                <input
                  className="input ch-other-input"
                  placeholder="Describe…"
                  value={answer.otherText ?? ''}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onChange={(e) => onChange({ ...answer, otherText: e.target.value })}
                  style={{ maxWidth: 200 }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
