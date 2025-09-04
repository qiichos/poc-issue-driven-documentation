"use client";

import { ExternalLink } from "lucide-react";
import type { Comment } from "@/app/page";

interface SidebarProps {
	comments: Comment[];
}

export default function Sidebar({ comments }: SidebarProps) {
	return (
		<div className="h-full bg-white">
			<div className="p-4 border-b border-gray-200">
				<h2 className="text-lg font-semibold text-gray-900">Comments</h2>
			</div>

			<div className="p-4 space-y-4">
				{comments.length === 0 ? (
					<p className="text-gray-500 text-sm">
						No comments yet. Select text in the editor and click "Comment" to
						create your first comment.
					</p>
				) : (
					comments.map((comment) => (
						<div
							key={comment.id}
							className="border border-gray-200 rounded-lg p-3"
						>
							<div className="mb-2">
								<p className="text-sm text-gray-600 mb-1">Excerpt:</p>
								<p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">
									"
									{comment.anchorText.length > 30
										? `${comment.anchorText.substring(0, 30)}...`
										: comment.anchorText}
									"
								</p>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">
									Issue #{comment.issueNumber}
								</span>
								<a
									href={comment.issueUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
								>
									View
									<ExternalLink size={12} />
								</a>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
