"use client";

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
import type { Comment } from "@/app/page";
import BubbleComment from "./BubbleComment";

interface DocumentEditorProps {
	content: string;
	comments: Comment[];
	onContentChange: (content: string) => void;
	onCommentClick: (from: number, to: number, text: string) => void;
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
}: DocumentEditorProps) {
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
				const markdownContent = (editor.storage as any).markdown?.getMarkdown() || editor.getHTML();
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

	// Set initial content when editor is created
	React.useEffect(() => {
		if (editor && content) {
			editor.commands.setContent(content);
		}
	}, [editor]); // Only run when editor is created

	if (!editor) {
		return null;
	}

	return (
		<div className="relative flex-1">
			<EditorContent editor={editor} />
			<BubbleComment editor={editor} onCommentClick={handleCommentClick} />
		</div>
	);
}
