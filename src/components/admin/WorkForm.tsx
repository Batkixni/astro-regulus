"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Save,
  Github,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  ImagePlus,
  Trash2,
} from "lucide-react";
import BlockNoteEditor from "./BlockNoteEditor";

interface Credit {
  name: string;
  role: string;
}

interface WorkData {
  title: string;
  client: string;
  role: string[];
  date: string;
  genre: string;
  thumbnail: string;
  videoUrl: string;
  description: string;
  credits: Credit[];
}

interface WorkFormProps {
  slug?: string;
  initialData?: WorkData;
  initialBody?: string;
  mode: "create" | "edit";
}

function emptyWork(): WorkData {
  const today = new Date().toISOString().split("T")[0];
  return {
    title: "",
    client: "",
    role: [],
    date: today,
    genre: "Motion",
    thumbnail: "",
    videoUrl: "",
    description: "",
    credits: [],
  };
}

export default function WorkForm({
  slug: initialSlug,
  initialData,
  initialBody = "",
  mode,
}: WorkFormProps) {
  const [data, setData] = useState<WorkData>(initialData || emptyWork());
  const [body, setBody] = useState(initialBody);
  const [slug, setSlug] = useState(initialSlug || "");
  const [commitToGitHub, setCommitToGitHub] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const isCreate = mode === "create";

  const generateSlug = useCallback((title: string, genre: string) => {
    const base = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    return `${genre.toLowerCase()}/${base || "untitled"}`;
  }, []);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!data.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!data.client.trim()) {
      setError("Client is required");
      return;
    }
    if (!data.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!data.thumbnail.trim()) {
      setError("Thumbnail is required");
      return;
    }

    const finalSlug = isCreate ? generateSlug(data.title, data.genre) : slug;

    setSaving(true);
    try {
      const url = isCreate ? "/api/works" : `/api/works/${slug}`;
      const method = isCreate ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: finalSlug,
          frontmatter: {
            ...data,
            role: data.role.filter(Boolean),
            credits: data.credits.filter((c) => c.name.trim()),
          },
          content: body,
          commitToGitHub,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Save failed");
      }

      setSuccess(isCreate ? "Work created successfully!" : "Work updated!");
      if (isCreate) {
        setSlug(finalSlug);
        // redirect after short delay
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadThumbnail = async (file: File) => {
    setUploadingThumb(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "thumbnails");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setData((prev) => ({ ...prev, thumbnail: data.url }));
    } catch (err: any) {
      setError(`Thumbnail upload failed: ${err.message}`);
    } finally {
      setUploadingThumb(false);
    }
  };

  const addRole = () => {
    const val = roleInput.trim();
    if (!val || data.role.includes(val)) return;
    setData((prev) => ({ ...prev, role: [...prev.role, val] }));
    setRoleInput("");
  };

  const removeRole = (idx: number) => {
    setData((prev) => ({ ...prev, role: prev.role.filter((_, i) => i !== idx) }));
  };

  const addCredit = () => {
    setData((prev) => ({ ...prev, credits: [...prev.credits, { name: "", role: "" }] }));
  };

  const updateCredit = (idx: number, field: keyof Credit, value: string) => {
    setData((prev) => ({
      ...prev,
      credits: prev.credits.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }));
  };

  const removeCredit = (idx: number) => {
    setData((prev) => ({
      ...prev,
      credits: prev.credits.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/admin"
            className="p-2 hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft size={18} />
          </a>
          <h1 className="text-2xl font-bold tracking-tight">
            {isCreate ? "New Work" : "Edit Work"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={commitToGitHub}
              onChange={(e) => setCommitToGitHub(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            <Github size={14} />
            Commit to GitHub
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Work"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-500 text-sm">
          {success}
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Frontmatter */}
        <div className="lg:col-span-1 space-y-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
              placeholder="Project title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
              Client
            </label>
            <input
              type="text"
              value={data.client}
              onChange={(e) => setData((prev) => ({ ...prev, client: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
              placeholder="Client name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
              Genre
            </label>
            <input
              type="text"
              value={data.genre}
              onChange={(e) => setData((prev) => ({ ...prev, genre: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
              placeholder="Motion, Cinematic, etc."
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => setData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
              Roles
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
                className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
                placeholder="Add role..."
              />
              <button
                onClick={addRole}
                className="px-3 py-2 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.role.map((role, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]"
                >
                  {role}
                  <button onClick={() => removeRole(i)} className="hover:text-[var(--foreground)]">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
              Thumbnail
            </label>
            <div className="space-y-2">
              {data.thumbnail && (
                <img
                  src={data.thumbnail}
                  alt="Thumbnail"
                  className="w-full aspect-video object-cover border border-[var(--border)]"
                />
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={data.thumbnail}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, thumbnail: e.target.value }))
                  }
                  className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder="Image URL"
                />
                <label className="px-3 py-2 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
                  <ImagePlus size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadThumbnail(file);
                    }}
                  />
                </label>
              </div>
              {uploadingThumb && (
                <p className="text-xs text-[var(--muted-foreground)]">Uploading...</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
              Video URL (optional)
            </label>
            <input
              type="text"
              value={data.videoUrl}
              onChange={(e) => setData((prev) => ({ ...prev, videoUrl: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
              placeholder="YouTube or direct video URL"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
              Description
            </label>
            <textarea
              value={data.description}
              onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--primary)] transition-colors resize-y"
              placeholder="Short project description"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                Credits
              </label>
              <button
                onClick={addCredit}
                className="text-xs flex items-center gap-1 text-[var(--primary)] hover:underline"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {data.credits.map((credit, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={credit.name}
                    onChange={(e) => updateCredit(i, "name", e.target.value)}
                    placeholder="Name"
                    className="flex-1 px-2 py-1.5 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-xs outline-none focus:border-[var(--primary)]"
                  />
                  <input
                    type="text"
                    value={credit.role}
                    onChange={(e) => updateCredit(i, "role", e.target.value)}
                    placeholder="Role"
                    className="flex-1 px-2 py-1.5 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-xs outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    onClick={() => removeCredit(i)}
                    className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-2 space-y-3">
          <label className="block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            Content Editor
          </label>
          <div className="border border-[var(--border)] bg-[var(--background)] min-h-[600px]">
            <BlockNoteEditor initialBody={initialBody} onChange={setBody} />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Use / for slash commands. Type "/mdx" to insert MDX components like Grid,
            Video, or YouTube.
          </p>
        </div>
      </div>
    </div>
  );
}
