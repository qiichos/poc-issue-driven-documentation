"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";
import type { Comment } from "@/app/page";

interface CommentModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedText: {
		from: number;
		to: number;
		text: string;
	} | null;
	onAddComment: (comment: Comment) => void;
}

export default function CommentModal({
	isOpen,
	onClose,
	selectedText,
	onAddComment,
}: CommentModalProps) {
	const [commentBody, setCommentBody] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const commentId = useId();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedText || !commentBody.trim()) return;

		setIsSubmitting(true);
		setError("");

		try {
			const response = await fetch("/api/comments", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					from: selectedText.from,
					to: selectedText.to,
					anchorText: selectedText.text,
					body: commentBody,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to create comment");
			}

			const { issueNumber, issueUrl } = await response.json();

			const newComment: Comment = {
				id: crypto.randomUUID(),
				from: selectedText.from,
				to: selectedText.to,
				anchorText: selectedText.text,
				issueNumber,
				issueUrl,
			};

			onAddComment(newComment);
			setCommentBody("");
		} catch (_err) {
			setError("Failed to create comment. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">Add Comment</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={20} />
					</button>
				</div>

				{selectedText && (
					<div className="mb-4 p-3 bg-gray-100 rounded-lg">
						<p className="text-sm text-gray-600 mb-1">Selected text:</p>
						<p className="text-sm font-medium text-black">
							"
							{selectedText.text.length > 50
								? `${selectedText.text.substring(0, 50)}...`
								: selectedText.text}
							"
						</p>
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label
							htmlFor={commentId}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Comment
						</label>
						<textarea
							id={commentId}
							value={commentBody}
							onChange={(e) => setCommentBody(e.target.value)}
							className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							rows={4}
							placeholder="Enter your comment..."
							required
						/>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
							<p className="text-red-700 text-sm">{error}</p>
						</div>
					)}

					<div className="flex gap-2 justify-end">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting || !commentBody.trim()}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md"
						>
							{isSubmitting ? "Creating..." : "Create Issue"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
