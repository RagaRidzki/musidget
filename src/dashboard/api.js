import { supabase } from '../supabase'

export async function uploadPublic(file, bucket) {
  const ext = file.name.split('.').pop()
  const key = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase
    .storage
    .from(bucket)
    .upload(key, file, { upsert: false })

  if (error) throw error

  const { data: pub } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(key)

  return pub.publicUrl
}

export async function createWidget({ slug, title, coverFile, trackFiles }) {
  const cover_url = coverFile
    ? await uploadPublic(coverFile, 'covers')
    : null

  const tracks = []
  for (const f of trackFiles.slice(0, 3)) {
    const url = await uploadPublic(f, 'audio')
    tracks.push({
      url,
      title: f.name,
      artist: ''
    })
  }

  // simpan metadata ke tabel widgets
  const { error } = await supabase
    .from('widgets')
    .upsert(
      { slug, title, cover_url, tracks },
      { onConflict: 'slug' }
    )

  if (error) throw error

  return { slug }
}
