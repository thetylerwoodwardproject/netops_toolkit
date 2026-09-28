// Settings for this toolkit instance.
//
// Don't edit this file to set up your own instance: copy the keys you want to
// change into toolkit.config.local.ts (gitignored), like this, and they are
// merged over these defaults at build time:
//
//   import { defineLocalToolkit } from './src/lib/toolkit-schema';
//
//   export default defineLocalToolkit({
//     name: 'Acme NetOps',
//     icon: 'tower-cell',
//     accent: '#2f7cf6',
//     site: 'https://tools.example.com',
//     footer: { links: [{ label: 'Acme', href: 'https://example.com', icon: 'building' }] },
//     categories: { broadcast: false },
//   });
//
// Icons are Font Awesome Free names as shown on fontawesome.com, e.g.
// 'network-wired'; prefix brand icons with 'brands:', e.g. 'brands:github'.
// An unknown name fails the build and says which one.
import { defineToolkit } from './src/lib/toolkit-schema';

export default defineToolkit({
  name: 'NetOps Toolkit',
  tagline: 'Calculators, config generators and references for network engineers.',
  icon: 'network-wired',
  accent: '#3cae32',
  site: 'http://localhost:4321',
  footer: {
    links: [],
  },
  categories: {},
  externalLookups: true,
  indexable: true,
});
