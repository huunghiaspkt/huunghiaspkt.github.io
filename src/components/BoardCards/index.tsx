import React from 'react';
import Link from '@docusaurus/Link';
import {BOARDS} from '@site/src/data/boards';
import styles from './styles.module.css';

/** One card per board that has a page in the Boards section (see src/data/boards.ts). */
export default function BoardCards(): React.JSX.Element {
  return (
    <div className={styles.grid}>
      {BOARDS.filter((b) => b.card).map((b) => (
        <Link key={b.id} className={styles.card} to={b.card!.page}>
          <img className={styles.image} src={b.card!.image} alt={b.label} loading="lazy" />
          <div className={styles.body}>
            <p className={styles.title}>{b.label}</p>
            <p className={styles.summary}>{b.card!.summary}</p>
            <code className={styles.target}>{b.target}</code>
          </div>
        </Link>
      ))}
    </div>
  );
}
