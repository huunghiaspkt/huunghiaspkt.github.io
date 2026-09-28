import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export type HwFeature = {
  type: string;
  location: string;
  description: string;
  compatible: string;
  /** Number of enabled devicetree nodes with this compatible. */
  count: number;
  /** Binding page in the Zephyr docs. */
  binding: string;
};

const ABBR: Record<string, string> = {
  ADC: 'Analog to Digital Converter',
  CPU: 'Central Processing Unit',
  DMA: 'Direct Memory Access',
  GPIO: 'General Purpose Input/Output',
  I2C: 'Inter-Integrated Circuit',
  I2S: 'Inter-IC Sound',
  LED: 'Light Emitting Diode',
  SD: 'Secure Digital',
};

/** "Supported features" table, modelled on the Zephyr board pages. */
export default function HwFeaturesTable({rows}: {rows: HwFeature[]}): React.JSX.Element {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <colgroup>
          <col style={{width: '15%'}} />
          <col style={{width: '12%'}} />
          <col style={{width: '48%'}} />
          <col style={{width: '25%'}} />
        </colgroup>
        <thead>
          <tr>
            <th>Type</th>
            <th>Location</th>
            <th>Description</th>
            <th>Compatible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.type}-${r.location}-${r.compatible}`}>
              <td className={styles.type}>
                {ABBR[r.type] ? <abbr title={ABBR[r.type]}>{r.type}</abbr> : r.type}
              </td>
              <td>
                <span className={clsx(styles.chip, r.location === 'on-chip' ? styles.onchip : styles.onboard)}>
                  {r.location}
                </span>
              </td>
              <td>
                {r.description}
                <span className={styles.count} title={`${r.count} enabled devicetree node(s)`}>
                  ×{r.count}
                </span>
              </td>
              <td className={styles.compatible}>
                <a href={r.binding} target="_blank" rel="noopener noreferrer">
                  <code>{r.compatible}</code>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
