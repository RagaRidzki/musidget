import { useState } from "react";
import { createWidget } from "./api";

export default function App() {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [link, setLink] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const res = await createWidget({
      slug,
      title,
      coverFile: cover,
      trackFiles: tracks,
    });
    setLink(`${window.location.origin}${res.url}`);
  }

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "40px auto",
        fontFamily: "system-ui,Arial",
      }}
    >
      <h2>Buat Widget Musik</h2>
      <form onSubmit={onSubmit}>
        <label>Slug</label>
        <input
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <label>Judul</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>Cover</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files[0])}
        />
        <label>Tracks (max 3)</label>
        <input
          type="file"
          accept="audio/*"
          multiple
          onChange={(e) => setTracks(Array.from(e.target.files).slice(0, 3))}
        />
        <button type="submit">Generate</button>
      </form>
      {link && (
        <div style={{ marginTop: 16 }}>
          <div>Widget URL:</div>
          <code>{link}</code>
          <div style={{ marginTop: 8 }}>HTML Embed:</div>
          <pre>{`<div class="mw-embed" data-slug="${slug}"></div>
                <script async src="${window.location.origin}/mw.js"></script>`}</pre>
          <div style={{ marginTop: 8 }}>
            Canva Embed: paste URL widget → {link}
          </div>
        </div>
      )}
    </div>
  );
}
