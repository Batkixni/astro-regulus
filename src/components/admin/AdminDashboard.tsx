import { useMemo, useState, type FormEvent } from "react";
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    CodeToggle,
    CreateLink,
    DiffSourceToggleWrapper,
    InsertTable,
    ListsToggle,
    MDXEditor,
    UndoRedo,
    codeBlockPlugin,
    diffSourcePlugin,
    headingsPlugin,
    linkPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    quotePlugin,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

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
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [works, setWorks] = useState(initialWorks);

    const roleList = useMemo(
        () =>
            roleText
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        [roleText],
    );

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
            const response = await fetch("/api/admin/work", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    title,
                    slug,
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

            setMessage(result.message ?? "作品建立成功。");
            setWorks((prev) => [
                {
                    slug: result.slug,
                    title,
                    client,
                    genre,
                    date,
                },
                ...prev,
            ]);

            setTitle("");
            setSlug("");
            setClient("");
            setRoleText("Director");
            setThumbnail("");
            setVideoUrl("");
            setDescription("");
            setBody("## Overview\n\n");
            setCredits(initialCredits);
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
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[1.25fr_0.75fr]">
                <section className="space-y-6 rounded-xl border border-border/60 bg-card/60 p-6 shadow-xl backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Content Studio
                            </p>
                            <h1 className="text-3xl font-bold tracking-tight">
                                新增作品
                            </h1>
                        </div>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                        >
                            登出
                        </button>
                    </div>

                    <form className="space-y-5" onSubmit={onSubmit}>
                        <div className="grid gap-4 md:grid-cols-2">
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
                                <span className="text-sm font-medium">Slug (可選)</span>
                                <input
                                    value={slug}
                                    onChange={(event) => setSlug(event.target.value)}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                                    placeholder="film-work-03"
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
                            <label className="space-y-2">
                                <span className="text-sm font-medium">
                                    Roles (逗號分隔)
                                </span>
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
                                {uploading && (
                                    <span className="text-sm text-muted-foreground">
                                        上傳中...
                                    </span>
                                )}
                            </div>
                            {thumbnail && (
                                <p className="mt-3 truncate text-sm text-muted-foreground">
                                    已上傳: {thumbnail}
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
                            <p className="text-sm font-semibold">
                                內容編輯器 (Notion 風格快速輸入)
                            </p>
                            <div className="overflow-hidden rounded-lg border border-border">
                                <MDXEditor
                                    markdown={body}
                                    onChange={setBody}
                                    className="min-h-[420px] bg-background"
                                    contentEditableClassName="prose prose-zinc dark:prose-invert max-w-none min-h-[320px] px-6 py-5"
                                    plugins={[
                                        headingsPlugin(),
                                        listsPlugin(),
                                        quotePlugin(),
                                        thematicBreakPlugin(),
                                        linkPlugin(),
                                        tablePlugin(),
                                        codeBlockPlugin({
                                            defaultCodeBlockLanguage: "txt",
                                        }),
                                        markdownShortcutPlugin(),
                                        diffSourcePlugin(),
                                        toolbarPlugin({
                                            toolbarContents: () => (
                                                <>
                                                    <UndoRedo />
                                                    <BlockTypeSelect />
                                                    <BoldItalicUnderlineToggles />
                                                    <CodeToggle />
                                                    <ListsToggle />
                                                    <CreateLink />
                                                    <InsertTable />
                                                    <DiffSourceToggleWrapper />
                                                </>
                                            ),
                                        }),
                                    ]}
                                />
                            </div>
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
                            disabled={submitting}
                            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {submitting ? "儲存中..." : "發布新作品"}
                        </button>
                    </form>
                </section>

                <aside className="rounded-xl border border-border/60 bg-card/50 p-5 shadow-xl">
                    <h2 className="mb-4 text-lg font-bold">近期作品</h2>
                    <ul className="space-y-3">
                        {works.slice(0, 20).map((work) => (
                            <li
                                key={work.slug}
                                className="rounded-md border border-border/70 bg-background/60 p-3"
                            >
                                <p className="font-medium">{work.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {work.client} • {work.genre}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground/80">
                                    {work.date} • /work/{work.slug}
                                </p>
                            </li>
                        ))}
                        {works.length === 0 && (
                            <li className="text-sm text-muted-foreground">尚無作品資料。</li>
                        )}
                    </ul>
                </aside>
            </div>
        </div>
    );
}
