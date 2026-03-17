import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const config = {
  plugins: {
    '@tailwindcss/postcss': {
      config: join(
        dirname(fileURLToPath(import.meta.url)),
        'tailwind.config.js'
      ),
    },
    autoprefixer: {},
  },
};

export default config;
