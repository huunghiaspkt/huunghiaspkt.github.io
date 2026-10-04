import React, {type ReactNode} from 'react';
import styles from './styles.module.css';

type Props = {
  image: string;
  imageAlt: string;
  caption: string;
  name: string;
  vendor: string;
  architecture: string;
  soc: string;
  sourcesUrl: string;
  /** Optional link to the board schematic (PDF), shown as a download button. */
  schematicUrl?: string;
};

/** Floating "Board Overview" card, modelled on the Zephyr board pages. */
export default function BoardOverview(props: Props): React.JSX.Element {
  const fields: [string, ReactNode][] = [
    ['Name', <code>{props.name}</code>],
    ['Vendor', props.vendor],
    ['Architecture', props.architecture],
    ['SoC', props.soc],
  ];

  return (
    <aside className={styles.card} aria-label="Board overview">
      <p className={styles.title}>Board Overview</p>
      <figure className={styles.figure}>
        <img src={props.image} alt={props.imageAlt} />
        <figcaption>{props.caption}</figcaption>
      </figure>
      <dl className={styles.fields}>
        {fields.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      <a className={styles.button} href={props.sourcesUrl} target="_blank" rel="noopener noreferrer">
        Browse board sources
      </a>
      {props.schematicUrl && (
        <a className={styles.button} href={props.schematicUrl} download>
          Download schematic (PDF)
        </a>
      )}
    </aside>
  );
}
