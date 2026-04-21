import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { marked } from "marked";
import TurndownService from "turndown";

type Props = {
    value: string;
    onChange: (markdown: string) => void;
};

type SlashItem = {
    key: string;
    label: string;
    hint: string;
    run: () => void;
};

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

const toHtml = (markdown: string) => {
    try {
        return String(marked.parse(markdown || ""));
    } catch {
        return "<p></p>";
    }
};

const toMarkdown = (html: string) => {
    const md = turndown.turndown(html || "");
    return md.trim().length > 0 ? `${md}\n` : "";
};

export function TiptapMarkdownEditor({ value, onChange }: Props) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const lastMarkdownRef = useRef(value);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [menuPos, setMenuPos] = useState({ x: 16, y: 16 });
    const [menuOpen, setMenuOpen] = useState(false);
    const menuOpenRef = useRef(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true }),
            Placeholder.configure({
                placeholder: "輸入 / 開啟指令選單（標題、清單、引用、分隔線、程式碼）",
            }),
        ],
        content: toHtml(value),
        editorProps: {
            attributes: {
                class: "tiptap min-h-[360px] p-6 text-foreground outline-none",
            },
            handleKeyDown(view, event) {
                if (menuOpenRef.current) {
                    if (event.key === "Escape") {
                        event.preventDefault();
                        setMenuOpen(false);
                        setQuery("");
                        setSelectedIndex(0);
                        return true;
                    }

                    if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setSelectedIndex((prev) => prev + 1);
                        return true;
                    }

                    if (event.key === "ArrowUp") {
                        event.preventDefault();
                        setSelectedIndex((prev) => Math.max(0, prev - 1));
                        return true;
                    }

                    if (event.key === "Backspace") {
                        event.preventDefault();
                        setQuery((prev) => prev.slice(0, -1));
                        return true;
                    }

                    if (event.key === " " || event.key === "Tab") {
                        event.preventDefault();
                        setMenuOpen(false);
                        setQuery("");
                        setSelectedIndex(0);
                        return true;
                    }

                    if (event.key.length === 1 && /[a-zA-Z0-9-]/.test(event.key)) {
                        event.preventDefault();
                        setQuery((prev) => prev + event.key.toLowerCase());
                        setSelectedIndex(0);
                        return true;
                    }
                }

                if (event.key !== "/") return false;
                if (!view.state.selection.empty) return false;

                const { from } = view.state.selection;
                const coords = view.coordsAtPos(from);
                const root = rootRef.current?.getBoundingClientRect();
                setMenuPos({
                    x: Math.max(8, coords.left - (root?.left ?? 0)),
                    y: Math.max(8, coords.top - (root?.top ?? 0) + 24),
                });
                setMenuOpen(true);
                setQuery("");
                setSelectedIndex(0);
                event.preventDefault();
                return true;
            },
        },
        onUpdate({ editor: next }) {
            const markdown = toMarkdown(next.getHTML());
            lastMarkdownRef.current = markdown;
            onChange(markdown);
        },
        immediatelyRender: false,
    });

    const slashItems = useMemo<SlashItem[]>(() => {
        if (!editor) return [];
        return [
            {
                key: "h1",
                label: "標題 1",
                hint: "大標題",
                run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            },
            {
                key: "h2",
                label: "標題 2",
                hint: "章節標題",
                run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            },
            {
                key: "bullet",
                label: "項目清單",
                hint: "Bullet List",
                run: () => editor.chain().focus().toggleBulletList().run(),
            },
            {
                key: "ordered",
                label: "編號清單",
                hint: "Ordered List",
                run: () => editor.chain().focus().toggleOrderedList().run(),
            },
            {
                key: "quote",
                label: "引用",
                hint: "Blockquote",
                run: () => editor.chain().focus().toggleBlockquote().run(),
            },
            {
                key: "code",
                label: "程式碼區塊",
                hint: "Code Block",
                run: () => editor.chain().focus().toggleCodeBlock().run(),
            },
            {
                key: "rule",
                label: "分隔線",
                hint: "Horizontal Rule",
                run: () => editor.chain().focus().setHorizontalRule().run(),
            },
        ];
    }, [editor]);

    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return slashItems;
        return slashItems.filter((item) => item.key.includes(q) || item.label.includes(q));
    }, [slashItems, query]);

    useEffect(() => {
        if (!editor) return;
        if (value === lastMarkdownRef.current) return;

        const nextHtml = toHtml(value);
        if (nextHtml === editor.getHTML()) return;

        editor.commands.setContent(nextHtml, false);
        lastMarkdownRef.current = value;
    }, [editor, value]);

    useEffect(() => {
        menuOpenRef.current = menuOpen;
    }, [menuOpen]);

    useEffect(() => {
        if (!menuOpen) return;
        if (filteredItems.length === 0) {
            setSelectedIndex(0);
            return;
        }
        if (selectedIndex > filteredItems.length - 1) {
            setSelectedIndex(filteredItems.length - 1);
        }
    }, [filteredItems, selectedIndex, menuOpen]);

    const applySlash = (index: number) => {
        const item = filteredItems[index];
        if (!item) return;
        item.run();
        setMenuOpen(false);
        setQuery("");
        setSelectedIndex(0);
    };

    useEffect(() => {
        if (!menuOpen || !editor) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                event.preventDefault();
                applySlash(selectedIndex);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [menuOpen, selectedIndex, editor, filteredItems]);

    if (!editor) return null;

    return (
        <div ref={rootRef} className="relative overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`rounded px-2 py-1 text-sm ${editor.isActive("bold") ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                    粗體
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`rounded px-2 py-1 text-sm ${editor.isActive("italic") ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                    斜體
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`rounded px-2 py-1 text-sm ${editor.isActive("underline") ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                    底線
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`rounded px-2 py-1 text-sm ${editor.isActive("heading", { level: 2 }) ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`rounded px-2 py-1 text-sm ${editor.isActive("bulletList") ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                    清單
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const current = editor.getAttributes("link").href as string | undefined;
                        const href = window.prompt("輸入連結", current ?? "https://");
                        if (href === null) return;
                        if (!href.trim()) {
                            editor.chain().focus().unsetLink().run();
                            return;
                        }
                        editor.chain().focus().setLink({ href: href.trim() }).run();
                    }}
                    className={`rounded px-2 py-1 text-sm ${editor.isActive("link") ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                    連結
                </button>
            </div>

            <EditorContent editor={editor} />

            {menuOpen && (
                <div
                    className="absolute z-20 w-64 rounded-lg border border-border bg-card p-1 shadow-2xl"
                    style={{ left: menuPos.x, top: menuPos.y }}
                >
                    <p className="px-2 py-1 text-xs text-muted-foreground">/{query || ""}</p>
                    <ul className="max-h-56 overflow-y-auto">
                        {filteredItems.length === 0 && (
                            <li className="px-2 py-2 text-sm text-muted-foreground">找不到指令</li>
                        )}
                        {filteredItems.map((item, index) => (
                            <li key={item.key}>
                                <button
                                    type="button"
                                    onClick={() => applySlash(index)}
                                    className={`flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm ${
                                        index === selectedIndex ? "bg-primary/15" : "hover:bg-muted"
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    <span className="text-xs text-muted-foreground">{item.hint}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
