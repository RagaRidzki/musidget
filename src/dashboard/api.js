import { supabase } from '../supabase'
import { renderWidgetHTML } from '../widget/template' // Vite dev ok; untuk prod, kita panggil API serverless untuk compile (lebih aman)

export async function uploadPublic(file, bucket) {
    const ext = file.name.split('.').pop();
    const key = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage.from(bucket).upload(key, file, { upsert: false });
    if (error) throw error;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
    return pub.publicUrl;
}

export async function createWidget({ slug, title, coverFile, trackFiles }) {
    // 1) upload cover + tracks ke bucket public
    const cover_url = coverFile ? await uploadPublic(coverFile, 'covers') : null;
    const tracks = [];
    for (const f of trackFiles.slice(0, 3)) {
        const url = await uploadPublic(f, 'audio');
        tracks.push({ url, title: f.name, artist: '' });
    }

    // 2) build manifest & compile HTML
    const manifest = { slug, title, cover_url, tracks };
    const html = renderWidgetHTML(manifest);

    // 3) upload compiled HTML ke storage public
    const path = `${slug}.html`;
    const { error: errUp } = await supabase.storage.from('widgets-html').upload(path, new Blob([html], { type: 'text/html' }), { upsert: true });
    if (errUp) throw errUp;

    // 4) simpan metadata ke tabel
    const { error: errDb } = await supabase.from('widgets').upsert({
        slug, title, cover_url, tracks, compiled_html_path: path
    }, { onConflict: 'slug' });
    if (errDb) throw errDb;

    return { slug, url: `/w/${encodeURIComponent(slug)}` };
}
