import { defineLocalToolkit } from '../../src/lib/toolkit-schema';

// tools.tylerwoodward.me (production). cutover.sh copies it to toolkit.config.local.ts and fixes the import path.
export default defineLocalToolkit({
  site: 'https://tools.tylerwoodward.me',
  footer: {
    note: 'Built by Tyler Woodward, host of The Tyler Woodward Project.',
    links: [
      { label: 'Website', href: 'https://tylerwoodward.me/', icon: 'tower-cell' },
      {
        label: 'Apple Podcasts',
        href: 'https://podcasts.apple.com/podcast/id1803865840',
        icon: 'brands:apple',
      },
      {
        label: 'Spotify',
        href: 'https://open.spotify.com/show/3yITnZVToJsnKpU04ma4at',
        icon: 'brands:spotify',
      },
      {
        label: 'Threads',
        href: 'https://www.threads.com/@tylerwoodward.me',
        icon: 'brands:threads',
      },
      {
        label: 'Bluesky',
        href: 'https://bsky.app/profile/tylerwoodward.me',
        icon: 'brands:bluesky',
      },
      {
        label: 'Instagram',
        href: 'https://www.instagram.com/tylerwoodward.me/',
        icon: 'brands:instagram',
      },
    ],
  },
});
