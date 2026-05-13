import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/blog',
    component: ComponentCreator('/blog', '98b'),
    exact: true
  },
  {
    path: '/blog/authors',
    component: ComponentCreator('/blog/authors', '0b7'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '822'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'ef5'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '3c6'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '88e'),
            routes: [
              {
                path: '/docs/aiot',
                component: ComponentCreator('/docs/aiot', 'ebf'),
                exact: true,
                sidebar: "aiotSidebar"
              },
              {
                path: '/docs/getting-started',
                component: ComponentCreator('/docs/getting-started', 'da0'),
                exact: true
              },
              {
                path: '/docs/getting-started/about',
                component: ComponentCreator('/docs/getting-started/about', '48c'),
                exact: true
              },
              {
                path: '/docs/hardware',
                component: ComponentCreator('/docs/hardware', '690'),
                exact: true,
                sidebar: "hardwareSidebar"
              },
              {
                path: '/docs/industrial-iot',
                component: ComponentCreator('/docs/industrial-iot', '8c7'),
                exact: true,
                sidebar: "iiotSidebar"
              },
              {
                path: '/docs/protocols',
                component: ComponentCreator('/docs/protocols', 'e70'),
                exact: true,
                sidebar: "protocolsSidebar"
              },
              {
                path: '/docs/reference/tools',
                component: ComponentCreator('/docs/reference/tools', '528'),
                exact: true,
                sidebar: "referenceSidebar"
              },
              {
                path: '/docs/zephyr-training/basic',
                component: ComponentCreator('/docs/zephyr-training/basic', 'e1f'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/basic/common-mistakes',
                component: ComponentCreator('/docs/zephyr-training/basic/common-mistakes', '870'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/basic/devicetree',
                component: ComponentCreator('/docs/zephyr-training/basic/devicetree', '6b4'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/basic/gpio',
                component: ComponentCreator('/docs/zephyr-training/basic/gpio', '0e0'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/basic/kconfig',
                component: ComponentCreator('/docs/zephyr-training/basic/kconfig', 'f03'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/basic/overlays',
                component: ComponentCreator('/docs/zephyr-training/basic/overlays', '237'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/how-to-start',
                component: ComponentCreator('/docs/zephyr-training/how-to-start', '010'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/how-to-start/build-system',
                component: ComponentCreator('/docs/zephyr-training/how-to-start/build-system', '51b'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/how-to-start/environment',
                component: ComponentCreator('/docs/zephyr-training/how-to-start/environment', 'a44'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/how-to-start/hello-world',
                component: ComponentCreator('/docs/zephyr-training/how-to-start/hello-world', '0b5'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/how-to-start/west',
                component: ComponentCreator('/docs/zephyr-training/how-to-start/west', '68d'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/how-to-start/what-is-zephyr',
                component: ComponentCreator('/docs/zephyr-training/how-to-start/what-is-zephyr', '299'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/intermediate',
                component: ComponentCreator('/docs/zephyr-training/intermediate', '7ae'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/intermediate/binding-yaml',
                component: ComponentCreator('/docs/zephyr-training/intermediate/binding-yaml', 'e5b'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/intermediate/ble-basics',
                component: ComponentCreator('/docs/zephyr-training/intermediate/ble-basics', 'c06'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/intermediate/i2c-sensors',
                component: ComponentCreator('/docs/zephyr-training/intermediate/i2c-sensors', 'b4c'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/intermediate/power-management',
                component: ComponentCreator('/docs/zephyr-training/intermediate/power-management', '7c3'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/intermediate/threads',
                component: ComponentCreator('/docs/zephyr-training/intermediate/threads', '9ad'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/intermediate/writing-drivers',
                component: ComponentCreator('/docs/zephyr-training/intermediate/writing-drivers', '554'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/real-product',
                component: ComponentCreator('/docs/zephyr-training/real-product', '0a3'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/real-product/custom-board',
                component: ComponentCreator('/docs/zephyr-training/real-product/custom-board', '8ab'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr-training/real-product/watchdog',
                component: ComponentCreator('/docs/zephyr-training/real-product/watchdog', '73b'),
                exact: true,
                sidebar: "zephyrTrainingSidebar"
              },
              {
                path: '/docs/zephyr/devicetree-primer',
                component: ComponentCreator('/docs/zephyr/devicetree-primer', '02e'),
                exact: true,
                sidebar: "zephyrNotesSidebar"
              },
              {
                path: '/docs/zephyr/writing-a-driver',
                component: ComponentCreator('/docs/zephyr/writing-a-driver', '2b8'),
                exact: true,
                sidebar: "zephyrNotesSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
