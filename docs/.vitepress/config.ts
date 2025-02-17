import type { HeadConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import { withPwa } from '@vite-pwa/vitepress'
import { defineConfig } from 'vitepress'

import viteConfig from './vite.config'

// https://vitepress.dev/reference/site-config

const analyticsHead: HeadConfig[] = [
  [
    'script',
    {
      'src': 'https://cdn.usefathom.com/script.js',
      'data-site': 'DCOEHMGA',
      'defer': '',
    },
  ],
]

const nav = [
  { text: 'Home', link: '/' },
  { text: 'Guide', link: '/intro' },
  { text: 'Config', link: '/config' },
  { text: 'GitHub', link: 'https://github.com/stacksjs/bun-git-hooks' },
]

const sidebar = [
  {
    text: 'Introduction',
    items: [
      { text: 'What is bun-git-hooks?', link: '/intro' },
      { text: 'Getting Started', link: '/usage' },
      { text: 'Configuration', link: '/config' },
    ],
  },
  {
    text: 'Advanced',
    items: [
      { text: 'Environment Variables', link: '/usage#environment-variables' },
      { text: 'Advanced Configuration', link: '/config#advanced-configuration' },
      { text: 'Best Practices', link: '/config#best-practices' },
    ],
  },
  {
    text: 'Community',
    items: [
      { text: 'Team', link: '/team' },
      { text: 'Sponsors', link: '/sponsors' },
      { text: 'Showcase', link: '/showcase' },
    ],
  },
]

const description = 'A modern, zero-dependency tool for managing git hooks in Bun projects'
const title = 'bun-git-hooks'

export default withPwa(
  defineConfig({
    lang: 'en-US',
    title: 'bun-git-hooks',
    description,
    metaChunk: true,
    cleanUrls: true,
    lastUpdated: true,

    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: './images/logo-mini.svg' }],
      ['link', { rel: 'icon', type: 'image/png', href: './images/logo.png' }],
      ['meta', { name: 'theme-color', content: '#0A0ABC' }],
      ['meta', { name: 'title', content: title }],
      ['meta', { name: 'description', content: description }],
      ['meta', { name: 'author', content: 'Stacks.js, Inc.' }],
      ['meta', {
        name: 'tags',
        content: 'bun-git-hooks, stacksjs, reverse proxy, modern, lightweight, zero-config, local development',
      }],

      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:locale', content: 'en' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],

      ['meta', { property: 'og:site_name', content: 'bun-git-hooks' }],
      ['meta', { property: 'og:image', content: './images/og-image.png' }],
      ['meta', { property: 'og:url', content: 'https://bun-git-hooks.netlify.app/' }],
      // ['script', { 'src': 'https://cdn.usefathom.com/script.js', 'data-site': '', 'data-spa': 'auto', 'defer': '' }],
      ...analyticsHead,
    ],

    themeConfig: {
      search: {
        provider: 'local',
      },
      logo: {
        light: './images/logo-transparent.svg',
        dark: './images/logo-white-transparent.svg',
      },

      nav,
      sidebar,

      editLink: {
        pattern: 'https://github.com/stacksjs/stacks/edit/main/docs/docs/:path',
        text: 'Edit this page on GitHub',
      },

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2024-present Stacks.js',
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/stacksjs/bun-git-hooks' },
        { icon: 'discord', link: 'https://discord.gg/stacksjs' },
      ],

      // algolia: services.algolia,

      // carbonAds: {
      //   code: '',
      //   placement: '',
      // },
    },

    pwa: {
      manifest: {
        theme_color: '#0A0ABC',
      },
    },

    markdown: {
      theme: {
        light: 'github-light',
        dark: 'github-dark',
      },

      codeTransformers: [
        transformerTwoslash(),
      ],
    },

    vite: viteConfig,
  }),
)
