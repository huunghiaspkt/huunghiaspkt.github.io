import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './index.module.css';

const CODE_SNIPPET = `/* Zephyr devicetree overlay — ESP32 */
&i2c0 {
    status = "okay";

    sht31: sht3xd@44 {
        compatible = "sensirion,sht3xd";
        reg = <0x44>;   /* 7-bit I2C address */
    };
};`;

const STATS = [
  {value: '12', label: translate({id: 'homepage.stats.lessons', message: 'Zephyr Lessons'})},
  {value: '∞', label: translate({id: 'homepage.stats.curiosity', message: 'Curiosity'})},
];

function getTopics() {
  return [
    {
      icon: '⚡',
      title: 'Zephyr RTOS',
      href: '/docs/zephyr-training/how-to-start/what-is-zephyr',
      badge: translate({id: 'topic.badge.active', message: 'Active'}),
      badgeColor: 'green',
      description: translate({
        id: 'topic.zephyr.desc',
        message: 'Devicetree, Kconfig, drivers, BLE, power management — from first west build to production firmware.',
      }),
    },
    {
      icon: '🔌',
      title: 'Protocols',
      href: '/docs/protocols',
      badge: translate({id: 'topic.badge.soon', message: 'Coming Soon'}),
      badgeColor: 'orange',
      description: translate({
        id: 'topic.protocols.desc',
        message: 'I2C, SPI, UART, CAN, MQTT — how they actually behave on real silicon, not just the datasheet.',
      }),
    },
    {
      icon: '🏭',
      title: 'Industrial IoT',
      href: '/docs/industrial-iot',
      badge: translate({id: 'topic.badge.soon', message: 'Coming Soon'}),
      badgeColor: 'orange',
      description: translate({
        id: 'topic.iiot.desc',
        message: 'Modbus, edge gateways, fieldbus protocols, rugged firmware patterns for industrial environments.',
      }),
    },
    {
      icon: '🤖',
      title: 'AIoT & Edge AI',
      href: '/docs/aiot',
      badge: translate({id: 'topic.badge.soon', message: 'Coming Soon'}),
      badgeColor: 'orange',
      description: translate({
        id: 'topic.aiot.desc',
        message: 'TensorFlow Lite Micro, Edge Impulse, running inference on constrained MCUs.',
      }),
    },
    {
      icon: '📋',
      title: 'Reference',
      href: '/docs/reference/tools',
      badge: translate({id: 'topic.badge.active', message: 'Active'}),
      badgeColor: 'green',
      description: translate({
        id: 'topic.reference.desc',
        message: 'West commands, pin tables, I2C address lookup, Kconfig flags — the cheat sheets you actually need.',
      }),
    },
  ];
}

function TopicCard({icon, title, href, badge, badgeColor, description}: ReturnType<typeof getTopics>[0]) {
  return (
    <Link to={href} className={styles.topicCard}>
      <div className={styles.topicCardHeader}>
        <span className={styles.topicIcon}>{icon}</span>
        <span className={`${styles.topicBadge} ${styles[`badge_${badgeColor}`]}`}>{badge}</span>
      </div>
      <strong className={styles.topicTitle}>{title}</strong>
      <p className={styles.topicDesc}>{description}</p>
    </Link>
  );
}

export default function Home(): ReactNode {
  const topics = getTopics();

  return (
    <Layout
      title={translate({id: 'homepage.meta.title', message: 'Home'})}
      description={translate({
        id: 'homepage.meta.description',
        message: 'EmbeddedFun — Zephyr RTOS training, PCB design, and embedded firmware documentation.',
      })}>

      {/* ── HERO ── */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <Translate id="homepage.hero.badge">Embedded Systems Knowledge Hub</Translate>
            </div>
            <Heading as="h1" className={styles.heroTitle}>
              <Translate id="homepage.hero.title">From bare metal to edge AI.</Translate>
            </Heading>
            <p className={styles.heroSub}>
              <Translate id="homepage.hero.sub">
                Zephyr RTOS guides, protocol deep dives, Industrial IoT patterns, and AIoT projects.
                Real code. Real hardware. Real results.
              </Translate>
            </p>
            <div className={styles.heroCtas}>
              <Link className="button button--primary button--lg" to="/docs/zephyr-training/how-to-start/what-is-zephyr">
                <Translate id="homepage.hero.cta.primary">Start with Zephyr →</Translate>
              </Link>
              <a className="button button--outline button--secondary button--lg" href="#topics">
                <Translate id="homepage.hero.cta.secondary">Browse topics ↓</Translate>
              </a>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.codeCard}>
              <div className={styles.codeCardHeader}>
                <span className={styles.codeDot} style={{background: '#ff5f56'}} />
                <span className={styles.codeDot} style={{background: '#ffbd2e'}} />
                <span className={styles.codeDot} style={{background: '#27c93f'}} />
                <span className={styles.codeCardFile}>esp32_devkitc_wroom.overlay</span>
              </div>
              <pre className={styles.codeBlock}><code>{CODE_SNIPPET}</code></pre>
            </div>
          </div>
        </div>
      </header>

      {/* ── STATS STRIP ── */}
      <div className={styles.statsStrip}>
        {STATS.map(s => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <main>
        {/* ── TOPICS GRID ── */}
        <section id="topics" className={styles.section}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>
              <Translate id="homepage.topics.title">Topics</Translate>
            </Heading>
            <p className={styles.sectionSub}>
              <Translate id="homepage.topics.sub">
                Pick your area. Beginners start with Zephyr RTOS. Experienced engineers jump straight to the topic.
              </Translate>
            </p>
            <div className={styles.topicGrid}>
              {topics.map(t => <TopicCard key={t.href} {...t} />)}
            </div>
          </div>
        </section>

        {/* ── LATEST FROM THE BENCH ── */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>
              <Translate id="homepage.bench.title">Latest from the Bench</Translate>
            </Heading>
            <p className={styles.sectionSub}>
              <Translate id="homepage.bench.sub">
                Build diaries — honest accounts of what worked, what burned, and what the next board spin will fix.
              </Translate>
            </p>
            <div className={styles.benchRow}>
              <div className={styles.benchCta}>
                <p>
                  <Translate id="homepage.bench.more">Build diaries, lessons learned, and notes from the field — coming soon.</Translate>
                </p>
                <Link className="button button--secondary" to="/blog">
                  <Translate id="homepage.bench.allPosts">All posts →</Translate>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
