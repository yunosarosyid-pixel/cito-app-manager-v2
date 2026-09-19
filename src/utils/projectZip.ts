import JSZip from 'jszip';
import { getCustomLogo } from './storage';

// Import all project source files dynamically as raw text strings
const rawSourceFiles = import.meta.glob(
  [
    '/src/**/*.{ts,tsx,css}',
    '/index.html',
    '/vite.config.ts',
    '/tsconfig*.json',
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

export async function downloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  // 1. Root configuration files
  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: 'cito-adventure-trip-archive',
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite --port=3000 --host=0.0.0.0',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          jspdf: '^4.2.1',
          jszip: '^3.10.1',
          'lucide-react': '^0.546.0',
          motion: '^12.23.24',
          react: '^19.0.1',
          'react-dom': '^19.0.1',
        },
        devDependencies: {
          '@tailwindcss/vite': '^4.1.14',
          '@types/node': '^22.14.0',
          '@vitejs/plugin-react': '^5.0.4',
          tailwindcss: '^4.1.14',
          typescript: '~5.8.2',
          vite: '^6.2.3',
          'vite-plugin-pwa': '^0.21.1',
        },
      },
      null,
      2
    )
  );

  zip.file(
    'README.md',
    `# Cito Adventure - Arsip Trip Gunung (PWA)

Aplikasi Progressive Web App (PWA) lengkap untuk manajemen arsip open trip dan generator materi promosi media sosial Cito Adventure Madiun:
- 🏔️ Database nama gunung populer Indonesia lengkap dengan ketinggian (MDPL)
- 📌 Rekomendasi jalur otomatis yang bisa disesuaikan
- 📅 Rentang tanggal dan kalkulasi durasi otomatis (mis. 2 Hari 1 Malam)
- 📍 Status trip sederhana: Buka / Tutup
- 👥 Kuota peserta dan notifikasi penyesuaian harga
- 🗓️ Rundown / Itinerary lengkap (termasuk format Hari, Tanggal, Jam Mulai - Selesai, dan Keterangan)
- 📋 Generator caption Instagram ringkas dengan hashtag dinamis otomatis
- 🖼️ Export Pamflet Trip & Itinerary dalam rasio 4:5 (Feed) dan 9:16 (Story)
- 📄 Export PDF & TXT
- 📱 PWA Installable (Bisa diinstall di Android, iOS, dan Desktop tanpa koneksi internet)

## Cara Menjalankan

\`\`\`bash
npm install
npm run dev
\`\`\`

Buka di browser pada \`http://localhost:3000\`
`
  );

  zip.file(
    '.gitignore',
    `node_modules/
dist/
.DS_Store
*.local
`
  );

  // GitHub Actions Workflow for automated GitHub Pages deployment
  zip.file(
    '.github/workflows/deploy.yml',
    `name: Deploy to GitHub Pages

on:
  push:
    branches: ['main', 'master']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci || npm install

      - name: Build project
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`
  );

  // 2. Web App Manifest
  zip.file(
    'public/manifest.webmanifest',
    JSON.stringify(
      {
        id: '/',
        name: 'Cito Adventure - Arsip Trip',
        short_name: 'Cito Trip',
        description: 'Aplikasi manajemen arsip trip dan pembuat poster serta caption open trip gunung Cito Adventure Madiun.',
        theme_color: '#275d1d',
        background_color: '#d1d1d1',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      null,
      2
    )
  );

  // 3. Add all source files dynamically from Vite raw imports
  for (const [filePath, content] of Object.entries(rawSourceFiles)) {
    // Strip leading slash e.g. "/src/App.tsx" -> "src/App.tsx"
    const relativePath = filePath.replace(/^\//, '');
    zip.file(relativePath, content);
  }

  // 4. Fetch and include public image/icon assets
  const publicIcons = [
    'pwa-192x192.png',
    'pwa-512x512.png',
    'pwa-maskable-512x512.png',
    'apple-touch-icon.png',
    'favicon.png',
    'logo.png',
  ];

  await Promise.all(
    publicIcons.map(async (iconName) => {
      try {
        const response = await fetch(`/${iconName}`);
        if (response.ok) {
          const blob = await response.blob();
          zip.file(`public/${iconName}`, blob);
        }
      } catch (err) {
        console.warn(`Could not fetch icon ${iconName} for zip:`, err);
      }
    })
  );

  // 4b. Ensure active brand logo is bundled into public/logo.png inside ZIP
  try {
    const activeLogoDataUrl = getCustomLogo();
    if (activeLogoDataUrl && activeLogoDataUrl.startsWith('data:image')) {
      const base64Content = activeLogoDataUrl.split(',')[1];
      if (base64Content) {
        zip.file('public/logo.png', base64Content, { base64: true });
      }
    }
  } catch (err) {
    console.warn('Could not inject custom logo into ZIP:', err);
  }

  // 5. Generate the zip and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cito-adventure-pwa-source-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

