const fs = require('fs');
const path = require('path');

function getOrigin() {
  try {
    const pkg = require(path.join(__dirname, '..', 'package.json'));
    const homepage = String(pkg.homepage || '').replace(/\/$/, '');
    if (homepage) return homepage;
  } catch (_) {}
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const m = raw.match(/REACT_APP_API_BASE_URL=(.*)/);
    const val = m ? m[1].trim() : '';
    const origin = val.replace(/\/$/, '').replace(/\/api$/, '');
    if (origin) return origin;
  } catch (_) {}
  return 'http://localhost:3000';
}

function buildXml(origin) {
  const urls = [
    { loc: origin + '/', changefreq: 'weekly', priority: '0.9' },
    { loc: origin + '/about', changefreq: 'weekly', priority: '0.7' },
    { loc: origin + '/contact', changefreq: 'weekly', priority: '0.7' },
    { loc: origin + '/search', changefreq: 'daily', priority: '0.8' },
    { loc: origin + '/profile', changefreq: 'weekly', priority: '0.6' },
    { loc: origin + '/appointments', changefreq: 'daily', priority: '0.8' },
    { loc: origin + '/login', changefreq: 'monthly', priority: '0.3' },
    { loc: origin + '/register', changefreq: 'monthly', priority: '0.3' }
  ];
  const body = urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

async function main() {
  const origin = getOrigin();
  // Pull doctor profile URLs from backend
  let extra = [];
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const m = raw.match(/REACT_APP_API_BASE_URL=(.*)/);
    const apiBase = (m ? m[1].trim() : '').replace(/\/$/, '');
    const url = apiBase ? apiBase + '/doctors' : 'http://localhost:5000/api/doctors';
    const mod = url.startsWith('https') ? require('https') : require('http');
    extra = await new Promise((resolve) => {
      const req = mod.get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            const text = Buffer.concat(chunks).toString('utf8');
            const data = JSON.parse(text);
            const arr = Array.isArray(data) ? data : [];
            const ids = arr.map((d) => String(d?.user?._id || '')).filter(Boolean);
            resolve(ids);
          } catch (_) { resolve([]); }
        });
      });
      req.on('error', () => resolve([]));
    });
  } catch (_) {}
  const docUrls = extra.map((id) => ({ loc: origin + '/doctor/' + id, changefreq: 'daily', priority: '0.8' }));
  const xml = (() => {
    const base = [
      { loc: origin + '/', changefreq: 'weekly', priority: '0.9' },
      { loc: origin + '/about', changefreq: 'weekly', priority: '0.7' },
      { loc: origin + '/contact', changefreq: 'weekly', priority: '0.7' },
      { loc: origin + '/search', changefreq: 'daily', priority: '0.8' },
      { loc: origin + '/profile', changefreq: 'weekly', priority: '0.6' },
      { loc: origin + '/appointments', changefreq: 'daily', priority: '0.8' },
      { loc: origin + '/login', changefreq: 'monthly', priority: '0.3' },
      { loc: origin + '/register', changefreq: 'monthly', priority: '0.3' }
    ].concat(docUrls);
    const body = base.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
  })();
  const outPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf8');
  process.stdout.write(`[sitemap] wrote ${outPath} for ${origin} with ${extra.length} doctor URLs\n`);
}

main();
