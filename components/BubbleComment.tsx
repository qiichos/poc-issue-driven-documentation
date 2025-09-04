"use client";

import type { Editor } from "@tiptap/react";
import { MessageSquare } from "lucide-react";
import React from "react";

interface BubbleCommentProps {
	editor: Editor | null;
	onCommentClick: () => void;
}

export default function BubbleComment({
	editor,
	onCommentClick,
}: BubbleCommentProps) {
	const [position, setPosition] = React.useState({ top: 0, left: 0 });
	const [visible, setVisible] = React.useState(false);

	React.useEffect(() => {
		if (!editor || !editor.view || !editor.view.dom) return;

		const updateBubbleMenu = () => {
			try {
				const { selection } = editor.state;
				const { from, to } = selection;

				if (from === to) {
					setVisible(false);
					return;
				}

				const start = editor.view.coordsAtPos(from);
				const end = editor.view.coordsAtPos(to);

				const rect = editor.view.dom.getBoundingClientRect();

				setPosition({
					top: start.top - rect.top - 50,
					left: (start.left + end.left) / 2 - rect.left - 40,
				});
				setVisible(true);
			} catch (error) {
				console.error("Error updating bubble menu:", error);
				setVisible(false);
			}
		};

		const handleSelectionChange = () => {
			setTimeout(updateBubbleMenu, 10);
		};

		const editorDom = editor.view.dom;
		editorDom.addEventListener("mouseup", handleSelectionChange);
		editorDom.addEventListener("keyup", handleSelectionChange);

		return () => {
			editorDom.removeEventListener("mouseup", handleSelectionChange);
			editorDom.removeEventListener("keyup", handleSelectionChange);
		};
	}, [editor]);

	if (!visible) return null;

	return (
		<div
			role="dialog"
			className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50"
			style={{
				top: position.top,
				left: position.left,
			}}
			onMouseDown={(e) => e.preventDefault()}
		>
			<button
				type="button"
				onClick={onCommentClick}
				className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
			>
				<MessageSquare size={16} />
				Comment
			</button>
		</div>
	);
}
