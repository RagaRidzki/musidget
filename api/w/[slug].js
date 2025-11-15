import { createClient } from '@supabase/supabase-js';

const supa = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function handler(req, res){
  const { slug } = req.query;
  if(!slug) return res.status(400).send('Bad Request');

  // ambil metadata: dapatkan path HTML “matang”
  const { data: rows, error } = await supa.from('widgets').select('compiled_html_path').eq('slug', slug).limit(1);
  if(error || !rows?.length) return res.status(404).send('Not Found');

  const path = rows[0].compiled_html_path;

  // ambil file HTML dari storage (public URL)
  const { data: pub } = supa.storage.from('widgets-html').getPublicUrl(path);
  const r = await fetch(pub.publicUrl);
  if(!r.ok) return res.status(404).send('Not Found');

  const html = await r.text();

  // CSP & Caching
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400'); // cache CDN Vercel
  res.setHeader('X-Frame-Options', ''); // kosongkan; gunakan CSP di bawah
  res.setHeader('Content-Security-Policy',
    "default-src 'none'; img-src * data:; media-src *; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src *; frame-ancestors https://canva.com https://*.canva.com https://*.canva.site 'self'; base-uri 'none'; form-action 'none';"
  );

  return res.status(200).send(html);
}
