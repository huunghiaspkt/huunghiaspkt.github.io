import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'EmbeddedFun',
  tagline: 'Embedded firmware engineer. Zephyr RTOS. I build the hardware too.',
  favicon: 'img/mylogo.png',

  future: { v4: true },

  markdown: {
    mermaid: true,
  },

  url: 'https://embeddedfun.org',
  baseUrl: '/',

  organizationName: 'huunghiaspkt',
  projectName: 'huunghiaspkt.github.io',
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    ['@docusaurus/plugin-ideal-image', {disableInDev: false}],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {from: '/docs/hardware', to: '/docs/boards'},
          {from: '/docs/zephyr-training/how-to-start/hello-world', to: '/docs/zephyr-training/how-to-start/environment'},
        ],
      },
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          exclude: ['design.md'],
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'Build Diary',
          blogDescription: 'Lab notes from the bench.',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    announcementBar: {
      id: 'efz-esp32s3-launch',
      content:
        '📦 New: the <strong>EFZ-ESP32S3</strong> community board is here — <a href="/blog/introducing-efz-esp32s3"><strong>read the announcement →</strong></a>',
      backgroundColor: '#2563eb',
      textColor: '#ffffff',
      isCloseable: true,
    },
    image: 'img/docusaurus-social-card.jpg',
    metadata: [
      {name: 'description', content: 'EmbeddedFun — Zephyr RTOS training, PCB design, and embedded firmware documentation.'},
      {name: 'keywords', content: 'Zephyr RTOS, embedded firmware, devicetree, PCB design, Altium, nRF52840'},
    ],
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'EmbeddedFun',
      logo: {
        alt: 'EmbeddedFun logo',
        src: 'img/mylogo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'zephyrTrainingSidebar',
          position: 'left',
          label: 'Zephyr RTOS',
        },
        {
          type: 'docSidebar',
          sidebarId: 'protocolsSidebar',
          position: 'left',
          label: 'Protocols',
        },
        {
          label: 'IoT',
          position: 'left',
          type: 'dropdown',
          items: [
            {
              type: 'docSidebar',
              sidebarId: 'iiotSidebar',
              label: 'Industrial IoT',
            },
            {
              type: 'docSidebar',
              sidebarId: 'aiotSidebar',
              label: 'AIoT & Edge AI',
            },
          ],
        },
        {
          type: 'docSidebar',
          sidebarId: 'boardsSidebar',
          position: 'left',
          label: 'Boards',
        },
        {
          type: 'docSidebar',
          sidebarId: 'referenceSidebar',
          position: 'left',
          label: 'Reference',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/huunghiaspkt',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Zephyr RTOS', to: '/docs/zephyr/devicetree-primer'},
            {label: 'Boards', to: '/docs/boards'},
            {label: 'Reference', to: '/docs/reference/tools'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'GitHub', href: 'https://github.com/huunghiaspkt'},
            {label: 'Build Diary', to: '/blog'},
          ],
        },
      ],
      copyright: `Built with Docusaurus. © ${new Date().getFullYear()} EmbeddedFun.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'c', 'yaml', 'cmake', 'diff'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
