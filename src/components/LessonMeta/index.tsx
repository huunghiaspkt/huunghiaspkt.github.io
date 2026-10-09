import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

function IconClock(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconChip(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2" />
    </svg>
  );
}

function IconArrow(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export interface LessonMetaProps {
  time?: string;
  need?: string;
  before?: string;
  beforeHref?: string;
}

export default function LessonMeta({
  time,
  need,
  before,
  beforeHref,
}: LessonMetaProps): React.JSX.Element {
  return (
    <div className={styles.meta}>
      {time && (
        <span className={styles.pill}>
          <IconClock />
          {time}
        </span>
      )}
      {need && (
        <span className={styles.pill}>
          <IconChip />
          {need}
        </span>
      )}
      {before && beforeHref && (
        <Link className={styles.before} to={beforeHref}>
          <IconArrow />
          <span>
            Before this: <strong>{before}</strong>
          </span>
        </Link>
      )}
    </div>
  );
}
