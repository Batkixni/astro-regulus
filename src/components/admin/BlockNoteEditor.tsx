"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import {
  useCreateBlockNote,
  createReactBlockSpec,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { Code2 } from "lucide-react";

// ─── Custom MDX Block ─────────────────────────────────────────────
const MDXBlock = createReactBlockSpec(
  {
    type: "mdx",
    propSchema: {
      code: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      return (
        <div className="my-2 border border-[var(--border)] bg-[var(--muted)] rounded-none">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border)] bg-[var(--muted)]/50">
            <Code2 size={14} className="text-[var(--muted-foreground)]" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--muted-foreground)]">
              MDX Component
            </span>
          </div>
          <textarea
            className="w-full bg-transparent p-3 text-xs font-mono resize-y min-h-[80px] outline-none text-[var(--foreground)]"
            defaultValue={block.props.code}
            placeholder='<Grid variant="bento">\n  <img src="..." />\n</Grid>'
            onChange={(e) => {
              editor.updateBlock(block, {
                props: { code: e.target.value },
              });
            }}
          />
        </div>
      );
    },
  }
);

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    mdx: MDXBlock(),
  },
});

// ─── Helpers ──────────────────────────────────────────────────────
function escapeMdxComponents(body: string): {
  text: string;
  components: Map<string, string>;
} {
  let counter = 0;
  const components = new Map<string, string>();

  // Match self-closing and paired MDX/JSX tags starting with uppercase
  const mdxRegex =
    /<([A-Z][a-zA-Z0-9]*)\b[^>]*>[\s\S]*?<\/\1>|<[A-Z][a-zA-Z0-9]*\b[^>]*\/>/g;

  const text = body.replace(mdxRegex, (match) => {
    const key = `__MDX_${counter++}__`;
    components.set(key, match);
    return `\n\n<!-- ${key} -->\n\n`;
  });

  return { text, components };
}

function getBlockText(block: any): string {
  if (!block.content) return "";
  return block.content.map((c: any) => c.text || "").join("");
}

function mdxToBlocks(editor: any, body: string) {
  const { text, components } = escapeMdxComponents(body);
  const blocks = editor.tryParseMarkdownToBlocks(text);

  const result: any[] = [];
  for (const block of blocks) {
    const blockText = getBlockText(block).trim();
    let replaced = false;

    for (const [key, code] of components) {
      if (blockText === `<!-- ${key} -->` || blockText.includes(key)) {
        result.push({
          type: "mdx",
          props: { code },
        });
        replaced = true;
        break;
      }
    }

    if (!replaced) {
      result.push(block);
    }
  }

  return result;
}

function blocksToMdx(editor: any): string {
  const parts: string[] = [];

  for (const block of editor.document) {
    if (block.type === "mdx") {
      parts.push(block.props.code);
    } else {
      const md = editor.blocksToMarkdownLossy([block]);
      parts.push(md);
    }
  }

  return parts.join("\n\n");
}

// ─── Component ────────────────────────────────────────────────────
interface BlockNoteEditorProps {
  initialBody?: string;
  onChange?: (mdx: string) => void;
}

export default function BlockNoteEditor({
  initialBody = "",
  onChange,
}: BlockNoteEditorProps) {
  const [loaded, setLoaded] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "editor");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  }, []);

  const editor = useCreateBlockNote({
    schema,
    uploadFile,
    initialContent: [
      {
        type: "paragraph",
        content: "Start writing your project content here...",
      },
    ],
  });

  // Load initial content
  useEffect(() => {
    if (!editor || loaded) return;
    if (!initialBody.trim()) {
      setLoaded(true);
      return;
    }

    const blocks = mdxToBlocks(editor, initialBody);
    editor.replaceBlocks(editor.document, blocks);
    setLoaded(true);
  }, [editor, initialBody, loaded]);

  // Emit MDX on change
  useEffect(() => {
    if (!editor || !loaded || !onChange) return;

    const handler = () => {
      onChange(blocksToMdx(editor));
    };

    const unsubscribe = editor.onChange(handler);
    // trigger initial
    handler();

    return () => unsubscribe();
  }, [editor, loaded, onChange]);

  const slashMenuItems = useCallback(
    (editor: any) =>
      [
        ...getDefaultReactSlashMenuItems(editor),
        {
          title: "MDX Component",
          onItemClick: () => {
            editor.insertBlocks(
              [{ type: "mdx", props: { code: "" } }],
              editor.getTextCursorPosition().block,
              "after"
            );
          },
          group: "Custom",
          icon: <Code2 size={16} />,
          subtext: "Insert raw MDX/JSX component",
        } as any,
      ].filter((item) => item.title !== "Image" && item.title !== "Video"),
    []
  );

  const filterItems = useCallback(
    async (query: string) => {
      const items = slashMenuItems(editor);
      const q = query.toLowerCase();
      return items.filter(
        (item: any) =>
          item.title.toLowerCase().includes(q) ||
          item.subtext?.toLowerCase().includes(q) ||
          item.aliases?.some((a: string) => a.toLowerCase().includes(q))
      );
    },
    [editor, slashMenuItems]
  );

  if (!editor) return null;

  return (
    <div className="bn-container">
      <BlockNoteView
        editor={editor}
        slashMenu={false}
        theme={isDark ? "dark" : "light"}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={filterItems}
        />
      </BlockNoteView>
    </div>
  );
}

export { blocksToMdx, mdxToBlocks };
