// Génère une page HTML complète (contenu inclus dans le fichier) pour chaque adresse du site.
// Les moteurs de recherche et les IA qui n'exécutent pas JavaScript lisent ainsi le vrai contenu.
//
// Usage (depuis le dossier build/) :
//   npm install
//   npm run build
//
// À relancer après toute modification de js/app.js (textes, FAQ, réalisations, avis...) ou de build/shell.html.
// Le script crée les dossiers, écrit chaque page à partir de shell.html, l'ouvre via un petit serveur local,
// puis enregistre la page complète. mentions-legales/index.html est un fichier à éditer à la main :
// le build ne touche qu'à son menu.

import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';

// Réglages du site (domaine, Facebook) : build/site.config.json
async function readConfig(siteDir) {
  try { return JSON.parse(await readFile(path.join(siteDir, 'build', 'site.config.json'), 'utf8')); } catch { return {}; }
}

// [clé de page, dossier]  ('' = racine du site)
export const PAGES = [
  ['home', ''],
  ['particuliers', 'particuliers'],
  ['plomberie', 'particuliers/plomberie'],
  ['chauffage', 'particuliers/chauffage'],
  ['climatisation', 'particuliers/climatisation'],
  ['pro', 'professionnels'],
  ['about', 'qui-suis-je'],
  ['contact', 'contact'],
];
export const STATIC_PAGES = ['mentions-legales'];

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };

function serve(siteDir) {
  const server = http.createServer(async (req, res) => {
    try {
      let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(siteDir, rel);
      if (!file.startsWith(siteDir)) throw new Error('hors du site');
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    } catch { res.writeHead(404); res.end('404'); }
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

const rootFor = (dir) => (dir ? '../'.repeat(dir.split('/').length) : '');

// sitemap.xml, robots.txt et llms.txt sont recréés à chaque build à partir de site.config.json
async function writeSeoFiles(siteDir, cfg) {
  const placeholder = !cfg.site;
  const site = (cfg.site || 'https://www.VOTRE-DOMAINE.fr').replace(/\/+$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const legalTodo = (await readFile(path.join(siteDir, 'mentions-legales', 'index.html'), 'utf8').catch(() => '')).includes('class="todo"');
  const dirs = [...PAGES.map((p) => p[1]), ...STATIC_PAGES.filter((d) => !(legalTodo && d === 'mentions-legales'))];
  const urls = dirs.map((d) => `  <url><loc>${site}/${d ? d + '/' : ''}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  await writeFile(path.join(siteDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n${placeholder ? '<!-- À COMPLÉTER : renseigner "site" dans build/site.config.json puis relancer le build -->\n' : ''}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await writeFile(path.join(siteDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /build/\n\n# Moteurs de recherche et assistants IA : accès autorisé au contenu public\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\n${placeholder ? '# À COMPLÉTER : renseigner "site" dans build/site.config.json puis relancer le build\n' : ''}Sitemap: ${site}/sitemap.xml\n`);
  const fb = cfg.facebook ? `- Facebook : ${cfg.facebook}\n` : '';
  await writeFile(path.join(siteDir, 'llms.txt'), `# Fluides & Co

> Plombier, chauffagiste et climaticien au Temple-de-Bretagne (44360), en Loire-Atlantique. Installation, entretien et dépannage pour particuliers, professionnels et tertiaire. Artisan : Maxime Contassot. SIRET 934 410 739 00015.

## Contact
- Téléphone : 06 77 49 23 84
- Email : fluidesandco44@gmail.com
- Zone d'intervention : Loire-Atlantique (agglomération nantaise, Saint-Nazaire, La Baule, Guérande, Pornic, Saint-Brevin, Pornichet)
- Avis clients : https://www.travaux.com/professionnel/fluides-and-co
${fb}
## Pages
- [Accueil](${site}/) : présentation, réalisations récentes, zone d'intervention, avis
- [Particuliers](${site}/particuliers/) : plomberie, chauffage, climatisation
- [Plomberie](${site}/particuliers/plomberie/) : dépannage, recherche de fuite, installation, salle de bains
- [Chauffage](${site}/particuliers/chauffage/) : chaudière, pompe à chaleur, désembouage, entretien
- [Climatisation](${site}/particuliers/climatisation/) : installation, entretien, dépannage
- [Professionnels et tertiaire](${site}/professionnels/) : maintenance, installation, dépannage pour les locaux
- [Qui suis-je ?](${site}/qui-suis-je/) : parcours, certifications, engagements
- [Contact et devis](${site}/contact/)
`);
}

export async function build(puppeteer, launchOptions, siteDir) {
  siteDir = path.resolve(siteDir);
  const shell = await readFile(path.join(siteDir, 'build', 'shell.html'), 'utf8');
  const cfg = await readConfig(siteDir);
  const server = await serve(siteDir);
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await puppeteer.launch(launchOptions);
  const errors = [];
  try {
    const snap = async (dir) => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.evaluateOnNewDocument((c) => { window.FC = c; }, { ...cfg, build: new Date().toISOString() });
      page.on('pageerror', (e) => errors.push(`${dir || '/'} : ${e.message}`));
      page.on('requestfailed', (r) => errors.push(`${dir || '/'} : ressource introuvable ${r.url()}`));
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`${dir || '/'} : ${r.status()} ${r.url()}`); });
      await page.goto(base + (dir ? dir + '/' : ''), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 400));
      await page.evaluate(() => { const b = document.getElementById('ck'); if (b) b.remove(); document.querySelectorAll('script[src*="googletagmanager"]').forEach((x) => x.remove()); });
      let html = await page.evaluate(() => '<!DOCTYPE html>\n' + document.documentElement.outerHTML + '\n');
      // les réglages restent dans la page : le JavaScript du navigateur régénère ainsi les mêmes balises
      html = html.replace(/<script id="fc-config">.*?<\/script>\n?/s, '').replace(/(<meta charset="utf-8">)/, `$1\n<script id="fc-config">window.FC=window.FC||${JSON.stringify(cfg).replace(/</g, '\\u003c')};</script>`);
      await page.close();
      return html;
    };
    for (const [key, dir] of PAGES) {
      const root = rootFor(dir);
      const skeleton = shell.replaceAll('{{ROOT}}', root).replaceAll('{{HOME}}', root || './')
        .replaceAll('{{PAGE}}', key).replaceAll('{{TITLE}}', 'Fluides &amp; Co');
      const target = path.join(siteDir, dir, 'index.html');
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, skeleton);
      const html = await snap(dir);
      await writeFile(target, html);
      console.log('✔', (dir ? dir + '/' : '') + 'index.html', `(${Math.round(html.length / 1024)} Ko)`);
    }
    for (const dir of STATIC_PAGES) {
      const full = path.join(siteDir, dir, 'index.html');
      try { await access(full); } catch { continue; }
      await writeFile(full, await snap(dir));
      console.log('✔', dir + '/index.html', '(statique, menu actualisé)');
    }
    await writeSeoFiles(siteDir, cfg);
  } finally {
    await browser.close();
    server.close();
  }
  if (errors.length) throw new Error('Problèmes détectés :\n' + errors.join('\n'));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const puppeteer = (await import('puppeteer')).default;
  const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  await build(puppeteer, { headless: true, args: ['--no-sandbox'] }, siteDir);
}
