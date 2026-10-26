"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, LoaderCircle, MessageCircle, MoreHorizontal, Send, Trash2 } from "lucide-react";

type Post = {
  id: string;
  author_id: string;
  body: string;
  visibility: "public" | "followers" | "private";
  media_urls?: string[] | null;
  media_url?: string | null;
  media_type?: string | null;
  created_at: string;
  updated_at?: string;
  author?: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

const visibilityLabels = { public: "Public", followers: "Abonnés", private: "Privé" };

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<Post["visibility"]>("public");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/posts?limit=30", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Impossible de charger le fil.");
      setPosts(result.posts ?? []);
      setCurrentUserId(result.currentUserId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPosts(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPosts]);

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), visibility }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "La publication a échoué.");
      setPosts((current) => [result.post, ...current]);
      setBody("");
      setNotice("Ta publication est en ligne.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "La publication a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(id: string) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Modification impossible.");
      setPosts((current) => current.map((post) => post.id === id ? result.post : post));
      setEditingId(null);
      setNotice("Publication modifiée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Modification impossible.");
    }
  }

  async function deletePost(id: string) {
    if (!window.confirm("Supprimer définitivement cette publication ?")) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Suppression impossible.");
      setPosts((current) => current.filter((post) => post.id !== id));
      setNotice("Publication supprimée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    }
  }

  return (
    <main className="feed-shell">
      <header className="feed-header">
        <Link href="/" className="feed-back"><ArrowLeft size={18} /> Accueil</Link>
        <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">Ɛ</span><span>DJANVUƐ</span></Link>
        <span className="feed-header-label">Ton espace social</span>
      </header>

      <div className="feed-layout">
        <aside className="feed-sidebar">
          <span className="feed-eyebrow">TON UNIVERS</span>
          <h1>Le fil des liens.</h1>
          <p>Les idées, les histoires et les moments partagés par ta communauté.</p>
          <div className="feed-sidebar-note"><span className="feed-status-dot" /> Connecté à ton espace DJANVUƐ</div>
        </aside>

        <section className="feed-main" aria-label="Fil d’actualité">
          <form className="composer-card" onSubmit={createPost}>
            <div className="composer-heading"><div className="avatar-placeholder">Ɛ</div><div><strong>Quoi de neuf ?</strong><span>Partage une pensée avec ta communauté.</span></div></div>
            <label className="sr-only" htmlFor="post-body">Écris ta publication</label>
            <textarea id="post-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={5000} placeholder="Une idée, une histoire, une bonne nouvelle…" rows={4} />
            <div className="composer-footer"><label className="visibility-select">Visibilité <select value={visibility} onChange={(event) => setVisibility(event.target.value as Post["visibility"])}>{Object.entries(visibilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button-primary" type="submit" disabled={submitting || !body.trim()}>{submitting ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />} Publier</button></div>
          </form>

          {error && <p className="feed-alert feed-alert-error" role="alert">{error}{/Authentification requise/i.test(error) ? " Connecte-toi avec ton compte pour accéder au fil." : ""}</p>}
          {notice && <p className="feed-alert feed-alert-success" role="status">{notice}</p>}

          <div className="feed-section-heading"><h2>Dernières publications</h2><button type="button" className="refresh-button" onClick={() => void loadPosts()}>Actualiser</button></div>
          {loading ? <div className="feed-state"><LoaderCircle className="spin" size={24} /><span>Chargement des publications…</span></div> :
            posts.length === 0 ? <div className="feed-empty"><div className="feed-empty-icon"><MessageCircle size={24} /></div><h3>Le début de quelque chose.</h3><p>Aucune publication à afficher pour le moment. Partage la première idée.</p></div> :
            <div className="post-list">{posts.map((post) => <article className="post-card" key={post.id}>
              <div className="post-top"><div className="avatar-placeholder small">{post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" /> : (post.author?.display_name || post.author?.username || "Ɛ").slice(0, 1).toUpperCase()}</div><div className="post-author"><strong>{post.author?.display_name || (post.author?.username ? `@${post.author.username}` : "Membre DJANVUƐ")}</strong><span>{new Date(post.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })} · {visibilityLabels[post.visibility]}</span></div>{post.author_id === currentUserId && <button type="button" className="icon-button" aria-label="Modifier la publication" onClick={() => { setEditingId(editingId === post.id ? null : post.id); setEditBody(post.body ?? ""); }}><MoreHorizontal size={20} /></button>}</div>
              {editingId === post.id ? <div className="edit-post"><textarea aria-label="Modifier la publication" value={editBody} maxLength={5000} onChange={(event) => setEditBody(event.target.value)} rows={4}/><div className="edit-actions"><button type="button" className="text-button" onClick={() => setEditingId(null)}>Annuler</button><button type="button" className="button-primary" onClick={() => void saveEdit(post.id)}>Enregistrer</button></div></div> : <p className="post-body">{post.body}</p>}
              {(post.media_urls?.length || post.media_url) ? <div className="post-media-note"><ImagePlus size={16} /> Média associé à cette publication</div> : null}
              <div className="post-actions"><span><MessageCircle size={16} /> Conversation</span>{post.author_id === currentUserId && <button type="button" className="delete-post-button" onClick={() => void deletePost(post.id)}><Trash2 size={15} /> Supprimer</button>}</div>
            </article>)}</div>
          }
        </section>
      </div>
      <footer className="feed-footer">DJANVUƐ · Les liens font grandir.</footer>
    </main>
  );
}
