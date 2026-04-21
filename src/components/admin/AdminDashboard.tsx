import { useMemo, useState, type FormEvent } from "react";
import { TiptapMarkdownEditor } from "@/components/admin/TiptapMarkdownEditor";

type WorkSummary = {
    slug: string;
    title: string;
    client: string;
    genre: string;
    date: string;
};

type Props = {
    initialWorks: WorkSummary[];
};

type Credit = {
    name: string;
    role: string;
};

type WorkDetail = {
    slug: string;
    title: string;
    client: string;
    role: string[];
    date: string;
    genre: string;
    thumbnail: string;
    videoUrl: string;
    description: string;
    credits: Credit[];
    body: string;
};

const initialCredits: Credit[] = [{ name: "", role: "" }];
const today = new Date().toISOString().slice(0, 10);

export function AdminDashboard({ initialWorks }: Props) {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [client, setClient] = useState("");
    const [date, setDate] = useState(today);
    const [genre, setGenre] = useState("Motion");
    const [roleText, setRoleText] = useState("Director");
    const [thumbnail, setThumbnail] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [description, setDescription] = useState("");
    const [body, setBody] = useState("## Overview\n\n");
    const [credits, setCredits] = useState<Credit[]>(initialCredits);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loadingWork, setLoadingWork] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [works, setWorks] = useState(initialWorks);
    const [activeSlug, setActiveSlug] = useState<string | null>(null);

    const roleList = useMemo(
        () =>
            roleText
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        [roleText],
    );

    const resetForm = () => {
        setActiveSlug(null);
        setTitle("");
        setSlug("");
        setClient("");
        setDate(today);
        setGenre("Motion");
        setRoleText("Director");
        setThumbnail("");
        setVideoUrl("");
        setDescription("");
        setBody("## Overview\n\n");
        setCredits(initialCredits);
        setError("");
        setMessage("已切換到新作品模式。");
    };

    const applyWork = (work: WorkDetail) => {
        setActiveSlug(work.slug);
        setTitle(work.title);
        setSlug(work.slug.split("/").pop() ?? work.slug);
        setClient(work.client);
        setDate(work.date);
        setGenre(work.genre || "Motion");
        setRoleText(work.role.join(", "));
        setThumbnail(work.thumbnail);
        setVideoUrl(work.videoUrl || "");
        setDescription(work.description || "");
        setBody(work.body || "## Overview\n\n");
        setCredits(work.credits.length > 0 ? work.credits : initialCredits);
    };

    const loadWork = async (nextSlug: string) => {
        if (!nextSlug) {
            resetForm();
            return;
        }

        setLoadingWork(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(`/api/admin/work?slug=${encodeURIComponent(nextSlug)}`);
            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(result.message ?? "讀取文件失敗。");
            }

            applyWork(result.work as WorkDetail);
            setMessage("已載入文件，可直接編輯。");
        } catch (err) {
            setError(err instanceof Error ? err.message : "讀取文件失敗。");
        } finally {
            setLoadingWork(false);
        }
    };

    const onUpload = async (file: File | null) => {
        if (!file) return;
        setUploading(true);
        setError("");
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(result.message ?? "上傳失敗。");
            }

            setThumbnail(result.url);
            setMessage("檔案上傳成功。");
        } catch (err) {
            setError(err instanceof Error ? err.message : "上傳失敗。");
        } finally {
            setUploading(false);
        }
    };

    const onCreditChange = (index: number, key: keyof Credit, value: string) => {
        setCredits((prev) =>
            prev.map((credit, i) => (i === index ? { ...credit, [key]: value } : credit)),
        );
    };

    const addCredit = () => {
        setCredits((prev) => [...prev, { name: "", role: "" }]);
    };

    const removeCredit = (index: number) => {
        setCredits((prev) => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        setMessage("");

        try {
            const editing = Boolean(activeSlug);
            const response = await fetch("/api/admin/work", {
                method: editing ? "PUT" : "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    title,
                    slug,
                    targetSlug: activeSlug,
                    client,
                    date,
                    genre,
                    role: roleList,
                    thumbnail,
                    videoUrl,
                    description,
                    body,
                    credits,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.ok) {
                throw new Error(result.message ?? "儲存失敗。");
            }

            const savedSlug = String(result.slug);
            const summary: WorkSummary = {
                slug: savedSlug,
                title,
                client,
                genre,
                date,
            };

            setWorks((prev) => {
                const withoutTarget = prev.filter((item) => item.slug !== savedSlug && item.slug !== activeSlug);
                return [summary, ...withoutTarget];
            });

            setActiveSlug(savedSlug);
            setMessage(editing ? "作品已更新。" : "作品已建立。可繼續編輯。");

            if (!editing) {
                setSlug(savedSlug.split("/").pop() ?? "");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "儲存失敗。");
        } finally {
            setSubmitting(false);
        }
    };

    const onLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.10),transparent_38%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))] text-foreground">
            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
                <header className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-2xl backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Content Studio
                            </p>
                            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                            >
                                新作品
                            </button>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                            >
                                登出
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-md border border-border/70 bg-background/60 px-3 py-2">
                            <p className="text-xs text-muted-foreground">總作品</p>
                            <p className="text-xl font-semibold">{works.length}</p>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/60 px-3 py-2">
                            <p className="text-xs text-muted-foreground">目前模式</p>
                            <p className="text-sm font-semibold">{activeSlug ? "編輯既有作品" : "建立新作品"}</p>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/60 px-3 py-2">
                            <p className="text-xs text-muted-foreground">目前文件</p>
                            <p className="truncate text-sm font-semibold">{activeSlug ?? "(新作品)"}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                    <section className="space-y-5 rounded-2xl border border-border/60 bg-card/85 p-6 shadow-2xl backdrop-blur">
                        <form className="space-y-5" onSubmit={onSubmit}>
                            <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-medium">切換文件</span>
                                <select
                                    value={activeSlug ?? ""}
                                    onChange={(event) => loadWork(event.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                    disabled={loadingWork || submitting}
                                >
                                    <option value="">+ 新作品</option>
                                    {works.map((work) => (
                                        <option key={work.slug} value={work.slug}>
                                            {work.title} ({work.slug})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium">作品標題</span>
                                <input
                                    required
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                    placeholder="Film Work 03"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium">Slug (建立時可填)</span>
                                <input
                                    value={slug}
                                    onChange={(event) => setSlug(event.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                    placeholder="film-work-03"
                                    disabled={Boolean(activeSlug)}
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium">Client</span>
                                <input
                                    required
                                    value={client}
                                    onChange={(event) => setClient(event.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium">Date</span>
                                <input
                                    required
                                    type="date"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium">Genre</span>
                                <input
                                    value={genre}
                                    onChange={(event) => setGenre(event.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                />
                            </label>
                            <label className="space-y-2 md:col-span-2">
                                <span className="text-sm font-medium">Roles (逗號分隔)</span>
                                <input
                                    required
                                    value={roleText}
                                    onChange={(event) => setRoleText(event.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                    placeholder="Director, Motion Designer"
                                />
                            </label>
                        </div>

                            <label className="space-y-2">
                                <span className="text-sm font-medium">Description</span>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                />
                            </label>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-medium">Thumbnail URL</span>
                                    <input
                                        required
                                        value={thumbnail}
                                        onChange={(event) => setThumbnail(event.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                        placeholder="/uploads/work/2026/04/your-image.jpg"
                                    />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-medium">Video URL (可選)</span>
                                    <input
                                        value={videoUrl}
                                        onChange={(event) => setVideoUrl(event.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                    />
                                </label>
                            </div>

                            <div className="rounded-md border border-dashed border-border p-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={(event) =>
                                            onUpload(event.currentTarget.files?.[0] ?? null)
                                        }
                                        className="text-sm"
                                    />
                                    {(uploading || loadingWork) && (
                                        <span className="text-sm text-muted-foreground">
                                            {uploading ? "上傳中..." : "讀取文件中..."}
                                        </span>
                                    )}
                                </div>
                                {thumbnail && (
                                    <p className="mt-3 truncate text-sm text-muted-foreground">
                                        檔案: {thumbnail}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3 rounded-md border border-border p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">Credits</p>
                                    <button
                                        type="button"
                                        onClick={addCredit}
                                        className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                                    >
                                        新增 Credit
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {credits.map((credit, index) => (
                                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={index}>
                                            <input
                                                value={credit.role}
                                                onChange={(event) =>
                                                    onCreditChange(index, "role", event.target.value)
                                                }
                                                placeholder="Role"
                                                className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                            />
                                            <input
                                                value={credit.name}
                                                onChange={(event) =>
                                                    onCreditChange(index, "name", event.target.value)
                                                }
                                                placeholder="Name"
                                                className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeCredit(index)}
                                                className="rounded-md border border-border px-3 text-sm hover:bg-muted"
                                                disabled={credits.length === 1}
                                            >
                                                刪除
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">內容編輯器（Tiptap / Notion-like）</p>
                                    <p className="text-xs text-muted-foreground">輸入 / 可開啟指令</p>
                                </div>
                                <TiptapMarkdownEditor value={body} onChange={setBody} />
                            </div>

                            {message && (
                                <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                                    {message}
                                </p>
                            )}
                            {error && (
                                <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || loadingWork}
                                className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {submitting
                                    ? "儲存中..."
                                    : activeSlug
                                      ? "更新目前作品"
                                      : "發布新作品"}
                            </button>
                        </form>
                    </section>

                    <aside className="sticky top-4 h-fit rounded-2xl border border-border/60 bg-card/80 p-5 shadow-2xl">
                        <h2 className="mb-4 text-lg font-bold">作品文件列表</h2>
                        <ul className="space-y-2">
                            {works.slice(0, 50).map((work) => (
                                <li key={work.slug}>
                                    <button
                                        type="button"
                                        onClick={() => loadWork(work.slug)}
                                        className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                                            activeSlug === work.slug
                                                ? "border-primary bg-primary/10"
                                                : "border-border/70 bg-background/60 hover:bg-muted"
                                        }`}
                                    >
                                        <p className="truncate text-sm font-medium">{work.title}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {work.client} • {work.genre}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-muted-foreground/80">
                                            {work.date} • /work/{work.slug}
                                        </p>
                                    </button>
                                </li>
                            ))}
                            {works.length === 0 && (
                                <li className="text-sm text-muted-foreground">尚無作品資料。</li>
                            )}
                        </ul>
                    </aside>
                </div>
            </div>
        </div>
    );
}
