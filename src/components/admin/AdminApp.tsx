import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { useEffect, useMemo, useState } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";

type Credit = { name: string; role: string };
type Draft = {
  id: string;
  slug: string;
  title: string;
  client: string;
  role: string[];
  date: string;
  genre: string;
  thumbnail: string;
  videoUrl?: string;
  description: string;
  credits?: Credit[];
  markdown: string;
  rawMdx: string;
  status: "draft" | "published";
  updatedAt: string;
  publishedBranch?: string;
};

type Props = {
  initialDrafts: Draft[];
  initialDefaultBranch: string;
};

const parseCredits = (raw: string): Credit[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [role, name] = line.split("|").map((value) => value.trim());
      return { role: role || "", name: name || "" };
    })
    .filter((item) => item.name && item.role);

const stringifyCredits = (credits?: Credit[]) =>
  (credits || []).map((item) => `${item.role} | ${item.name}`).join("\n");

export function AdminApp({ initialDrafts, initialDefaultBranch }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [selectedId, setSelectedId] = useState(initialDrafts[0]?.id || "");
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState<string[]>([initialDefaultBranch]);
  const [branch, setBranch] = useState(initialDefaultBranch);
  const [message, setMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.id === selectedId) || drafts[0] || null,
    [drafts, selectedId],
  );

  const editor = useCreateBlockNote();

  useEffect(() => {
    const loadBranches = async () => {
      const response = await fetch("/api/admin/branches");
      if (!response.ok) return;
      const payload = (await response.json()) as {
        branches: string[];
        defaultBranch?: string;
      };
      if (payload.branches?.length) {
        setBranches(payload.branches);
        setBranch((current) =>
          payload.branches.includes(current)
            ? current
            : payload.defaultBranch || payload.branches[0],
        );
      }
    };

    void loadBranches();
  }, []);

  useEffect(() => {
    if (!selectedDraft) return;
    const blocks = editor.tryParseMarkdownToBlocks(selectedDraft.markdown || "");
    editor.replaceBlocks(editor.document, blocks);
  }, [selectedDraft?.id]);

  useEffect(() => {
    const listener = async (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        await saveDraft();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        await publishDraft();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const setDraftPatch = (patch: Partial<Draft>) => {
    if (!selectedDraft) return;

    setDrafts((current) =>
      current.map((draft) =>
        draft.id === selectedDraft.id
          ? {
              ...draft,
              ...patch,
            }
          : draft,
      ),
    );
  };

  const updateMarkdownFromEditor = () => {
    if (!selectedDraft) return;
    setDraftPatch({ markdown: editor.blocksToMarkdownLossy(editor.document) });
  };

  const saveDraft = async () => {
    if (!selectedDraft) return;
    setIsSaving(true);
    setMessage("");

    try {
      const payload = {
        ...selectedDraft,
        markdown: editor.blocksToMarkdownLossy(editor.document),
      };

      const response = await fetch(`/api/admin/drafts/${selectedDraft.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { draft?: Draft; error?: string };
      if (!response.ok || !result.draft) {
        setMessage(result.error || "Save failed");
        return;
      }

      setDrafts((current) =>
        current.map((draft) => (draft.id === result.draft?.id ? result.draft : draft)),
      );
      setMessage("Saved");
    } finally {
      setIsSaving(false);
    }
  };

  const publishDraft = async () => {
    if (!selectedDraft || !branch) return;

    await saveDraft();

    setIsPublishing(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/drafts/${selectedDraft.id}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ branch }),
      });
      const result = (await response.json()) as {
        error?: string;
        commitSha?: string;
      };

      if (!response.ok) {
        setMessage(result.error || "Publish failed");
        return;
      }

      setMessage(`Published ${result.commitSha?.slice(0, 7) || ""}`);
      await refreshDrafts(selectedDraft.id);
    } finally {
      setIsPublishing(false);
    }
  };

  const refreshDrafts = async (nextSelectedId?: string) => {
    const response = await fetch("/api/admin/drafts");
    if (!response.ok) return;
    const payload = (await response.json()) as { drafts: Draft[] };
    setDrafts(payload.drafts || []);
    if (nextSelectedId) setSelectedId(nextSelectedId);
  };

  const createNewDraft = async () => {
    const response = await fetch("/api/admin/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) return;
    const payload = (await response.json()) as { draft: Draft };
    setDrafts((current) => [payload.draft, ...current]);
    setSelectedId(payload.draft.id);
  };

  const uploadThumbnail = async (file: File) => {
    if (!selectedDraft) return;

    const presignResponse = await fetch("/api/admin/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: selectedDraft.slug || "untitled",
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!presignResponse.ok) {
      const payload = (await presignResponse.json()) as { error?: string };
      setMessage(payload.error || "Failed to request upload URL");
      return;
    }

    const upload = (await presignResponse.json()) as {
      uploadUrl: string;
      publicUrl: string;
    };

    const putResponse = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!putResponse.ok) {
      setMessage("Upload failed");
      return;
    }

    setDraftPatch({ thumbnail: upload.publicUrl });
    setMessage("Image uploaded");
  };

  const filteredDrafts = drafts.filter((draft) => {
    if (!search.trim()) return true;
    const keyword = search.toLowerCase();
    return (
      draft.title.toLowerCase().includes(keyword) ||
      draft.slug.toLowerCase().includes(keyword) ||
      draft.genre.toLowerCase().includes(keyword)
    );
  });

  if (!selectedDraft) {
    return <p className="text-sm text-muted-foreground">No draft found.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4 min-h-[78vh]">
      <aside className="border border-border bg-card p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <input
            className="w-full bg-background border border-border px-2 py-1 text-sm"
            placeholder="Search drafts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            className="px-2 py-1 text-xs bg-primary text-primary-foreground"
            onClick={createNewDraft}
          >
            New
          </button>
        </div>

        <div className="overflow-auto space-y-2 pr-1">
          {filteredDrafts.map((draft) => (
            <button
              key={draft.id}
              onClick={() => setSelectedId(draft.id)}
              className={`w-full text-left border px-2 py-2 transition-colors ${
                draft.id === selectedDraft.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <p className="text-sm font-semibold truncate">{draft.title || "Untitled"}</p>
              <p className="text-xs text-muted-foreground truncate">{draft.slug || "(no slug)"}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                {draft.status}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Editor</h2>
          <p className="text-xs text-muted-foreground">Cmd/Ctrl+S save, Cmd/Ctrl+Enter publish</p>
        </div>

        <div className="min-h-[420px] border border-border bg-background p-2">
          <BlockNoteView editor={editor} onChange={updateMarkdownFromEditor} />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Raw MDX Block</label>
          <textarea
            className="w-full min-h-[180px] border border-border bg-background p-3 text-sm font-mono"
            value={selectedDraft.rawMdx || ""}
            onChange={(event) => setDraftPatch({ rawMdx: event.target.value })}
            placeholder="Paste custom MDX blocks such as <Grid>, <YouTube>, <Video>..."
          />
        </div>
      </section>

      <aside className="border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Settings</h2>

        <div className="space-y-2">
          <input
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            placeholder="Title"
            value={selectedDraft.title}
            onChange={(event) => setDraftPatch({ title: event.target.value })}
          />
          <input
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            placeholder="Slug"
            value={selectedDraft.slug}
            onChange={(event) => setDraftPatch({ slug: event.target.value })}
          />
          <input
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            placeholder="Client"
            value={selectedDraft.client}
            onChange={(event) => setDraftPatch({ client: event.target.value })}
          />
          <input
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            placeholder="Roles (comma separated)"
            value={selectedDraft.role.join(", ")}
            onChange={(event) =>
              setDraftPatch({
                role: event.target.value
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean),
              })
            }
          />
          <input
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            placeholder="Date"
            type="date"
            value={selectedDraft.date}
            onChange={(event) => setDraftPatch({ date: event.target.value })}
          />
          <input
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            placeholder="Genre"
            value={selectedDraft.genre}
            onChange={(event) => setDraftPatch({ genre: event.target.value })}
          />
          <input
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            placeholder="Thumbnail URL"
            value={selectedDraft.thumbnail}
            onChange={(event) => setDraftPatch({ thumbnail: event.target.value })}
          />
          <input
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            placeholder="Video URL"
            value={selectedDraft.videoUrl || ""}
            onChange={(event) => setDraftPatch({ videoUrl: event.target.value || undefined })}
          />
          <textarea
            className="w-full min-h-[80px] border border-border bg-background px-3 py-2 text-sm"
            placeholder="Description"
            value={selectedDraft.description}
            onChange={(event) => setDraftPatch({ description: event.target.value })}
          />
          <textarea
            className="w-full min-h-[90px] border border-border bg-background px-3 py-2 text-sm font-mono"
            placeholder="Credits (Role | Name per line)"
            value={stringifyCredits(selectedDraft.credits)}
            onChange={(event) => setDraftPatch({ credits: parseCredits(event.target.value) })}
          />

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Thumbnail Upload</label>
            <input
              className="w-full text-sm"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void uploadThumbnail(file);
              }}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <select
            className="w-full border border-border bg-background px-3 py-2 text-sm"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
          >
            {branches.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="bg-secondary text-secondary-foreground px-3 py-2 text-sm font-semibold disabled:opacity-50"
              onClick={saveDraft}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              className="bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold disabled:opacity-50"
              onClick={publishDraft}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </button>
          </div>

          {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
        </div>
      </aside>
    </div>
  );
}
