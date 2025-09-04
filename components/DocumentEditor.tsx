"use client";

import type { Comment } from "@/app/page";
import { Extension } from "@tiptap/core";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Typography from "@tiptap/extension-typography";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import { createLowlight } from "lowlight";
import React from "react";
import { Markdown } from "tiptap-markdown";
import BubbleComment from "./BubbleComment";

interface DocumentEditorProps {
	content: string;
	comments: Comment[];
	onContentChange: (content: string) => void;
	onCommentClick: (from: number, to: number, text: string) => void;
	documentSlug?: string;
}

const HighlightExtension = Extension.create({
	name: "highlight",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("highlight"),
				state: {
					init: () => DecorationSet.empty,
					apply: (tr, set) => {
						set = set.map(tr.mapping, tr.doc);
						const action = tr.getMeta(this.name);
						if (action?.add) {
							const deco = Decoration.inline(action.add.from, action.add.to, {
								class: "bg-yellow-200 rounded px-1",
							});
							set = set.add(tr.doc, [deco]);
						}
						return set;
					},
				},
				props: {
					decorations(state) {
						return this.getState(state);
					},
				},
			}),
		];
	},
});

const lowlight = createLowlight();
lowlight.register("javascript", javascript);
lowlight.register("typescript", typescript);
lowlight.register("python", python);

export default function DocumentEditor({
	content,
	comments,
	onContentChange,
	onCommentClick,
	documentSlug,
}: DocumentEditorProps) {
	const [isPushing, setIsPushing] = React.useState(false);
	const [pushMessage, setPushMessage] = React.useState("");
	const [pushStatus, setPushStatus] = React.useState<
		"idle" | "success" | "error"
	>("idle");
	const editor = useEditor(
		{
			extensions: [
				StarterKit.configure({
					bulletList: false,
					orderedList: false,
					listItem: false,
				}),
				Typography,
				BulletList.configure({
					HTMLAttributes: {
						class: "tiptap-bullet-list",
					},
				}),
				OrderedList.configure({
					HTMLAttributes: {
						class: "tiptap-ordered-list",
					},
				}),
				ListItem.configure({
					HTMLAttributes: {
						class: "tiptap-list-item",
					},
				}),
				CodeBlockLowlight.configure({
					lowlight,
					HTMLAttributes: {
						class: "hljs",
					},
				}),
				Markdown,
				HighlightExtension,
			],
			immediatelyRender: false,
			content,
			editorProps: {
				attributes: {
					class:
						"prose max-w-none focus:outline-none min-h-[500px] p-4 border border-gray-300 rounded-lg bg-white",
				},
			},
			onUpdate: ({ editor }) => {
				// Use HTML as fallback if markdown storage is not available
				const markdownContent =
					(
						editor.storage as unknown as {
							markdown?: { getMarkdown: () => string };
						}
					).markdown?.getMarkdown() || editor.getHTML();
				onContentChange(markdownContent);
			},
		},
		[], // Remove content dependency to prevent re-creation
	);

	const addHighlight = React.useCallback(
		(from: number, to: number) => {
			if (editor) {
				editor.view.dispatch(
					editor.view.state.tr.setMeta("highlight", { add: { from, to } }),
				);
			}
		},
		[editor],
	);

	const handleCommentClick = () => {
		if (!editor) return;

		const { from, to } = editor.state.selection;
		const text = editor.state.doc.textBetween(from, to, " ");

		if (text.trim()) {
			onCommentClick(from, to, text);
		}
	};

	// Add highlights for existing comments
	React.useEffect(() => {
		if (editor && comments.length > 0) {
			comments.forEach((comment) => {
				addHighlight(comment.from, comment.to);
			});
		}
	}, [editor, comments, addHighlight]);

	// Set content when editor or content changes; skip if same
	React.useEffect(() => {
		if (!editor || !content) return;
		const current =
			(
				editor.storage as unknown as {
					markdown?: { getMarkdown: () => string };
				}
			).markdown?.getMarkdown() || editor.getHTML();
		if (current === content) return;
		editor.commands.setContent(content);
	}, [editor, content]);

	const handlePushToGitHub = async () => {
		if (isPushing) return;

		setIsPushing(true);
		setPushStatus("idle");

		try {
			const commitMessage = `Update ${documentSlug || "document"}: ${new Date().toISOString()}`;

			const response = await fetch("/api/git/push", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: commitMessage,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				if (result.skipped) {
					setPushMessage("No changes to push");
					setPushStatus("idle");
				} else {
					setPushMessage("Successfully pushed to GitHub!");
					setPushStatus("success");
				}
			} else {
				setPushMessage(result.error || "Failed to push changes");
				setPushStatus("error");
			}
		} catch (error) {
			console.error("Push error:", error);
			setPushMessage("Network error occurred");
			setPushStatus("error");
		} finally {
			setIsPushing(false);
			// Clear message after 3 seconds
			setTimeout(() => {
				setPushMessage("");
				setPushStatus("idle");
			}, 3000);
		}
	};

	if (!editor) {
		return null;
	}

	return (
		<div className="relative flex-1">
			{/* Push to GitHub Button */}
			<div className="absolute top-2 right-2 z-10 flex items-center gap-2">
				{pushMessage && (
					<div
						className={`px-3 py-1 rounded-md text-sm ${
							pushStatus === "success"
								? "bg-green-100 text-green-800"
								: pushStatus === "error"
									? "bg-red-100 text-red-800"
									: "bg-gray-100 text-gray-800"
						}`}
					>
						{pushMessage}
					</div>
				)}
				<button
					type="button"
					onClick={handlePushToGitHub}
					disabled={isPushing}
					className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
						isPushing
							? "bg-gray-300 text-gray-500 cursor-not-allowed"
							: "bg-blue-600 hover:bg-blue-700 text-white"
					}`}
				>
					{isPushing ? "更新中..." : "更新"}
				</button>
			</div>

			<EditorContent editor={editor} />
			<BubbleComment editor={editor} onCommentClick={handleCommentClick} />
		</div>
	);
}
