import type { BunpressConfig } from 'bunpress'

const config: BunpressConfig = {
  name: 'bun-git-hooks',
  description: 'A Bun-optimized TypeScript library for managing Git hooks with a robust set of configuration options.',
  url: 'https://bun-git-hooks.stacksjs.org',

  theme: {
    primaryColor: '#10B981',
  },

  nav: [
    { text: 'Guide', link: '/guide/getting-started' },
    { text: 'API', link: '/api-reference' },
    { text: 'GitHub', link: 'https://github.com/stacksjs/bun-git-hooks' },
  ],

  sidebar: [
    {
      text: 'Introduction',
      items: [
        { text: 'What is bun-git-hooks?', link: '/index' },
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Installation', link: '/install' },
      ],
    },
    {
      text: 'Guide',
      items: [
        { text: 'Hook Types', link: '/guide/hooks' },
        { text: 'Staged File Linting', link: '/guide/staged' },
      ],
    },
    {
      text: 'Configuration',
      items: [
        { text: 'Config Files', link: '/config' },
        { text: 'Hook Commands', link: '/features/hooks' },
        { text: 'Environment Variables', link: '/features/env' },
      ],
    },
    {
      text: 'Advanced',
      items: [
        { text: 'Custom Scripts', link: '/advanced/custom' },
        { text: 'Troubleshooting', link: '/advanced/troubleshooting' },
      ],
    },
    {
      text: 'API Reference',
      items: [
        { text: 'Functions', link: '/api-reference' },
        { text: 'Types', link: '/api/types' },
      ],
    },
  ],

  head: [
    ['meta', { name: 'author', content: 'Stacks.js' }],
    ['meta', { name: 'keywords', content: 'git hooks, bun, typescript, pre-commit, lint-staged, husky alternative' }],
  ],

  socialLinks: [
    { icon: 'github', link: 'https://github.com/stacksjs/bun-git-hooks' },
    { icon: 'discord', link: 'https://discord.gg/stacksjs' },
    { icon: 'twitter', link: 'https://twitter.com/stacksjs' },
  ],
}

export default config
