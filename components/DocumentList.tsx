"use client";

import { FileText } from "lucide-react";

interface Document {
	slug: string;
	title: string;
	filename: string;
}

interface DocumentListProps {
	documents: Document[];
	selectedDocument: string | null;
	onDocumentSelect: (slug: string) => void;
}

export default function DocumentList({
	documents,
	selectedDocument,
	onDocumentSelect,
}: DocumentListProps) {
	return (
		<div className="w-64 bg-gray-50 border-r border-gray-300 p-4">
			<h2 className="text-lg font-semibold text-gray-800 mb-4">Documents</h2>
			<div className="space-y-1">
				{documents.map((doc) => (
					<button
						key={doc.slug}
						type="button"
						onClick={() => onDocumentSelect(doc.slug)}
						className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md transition-colors ${
							selectedDocument === doc.slug
								? "bg-blue-100 text-blue-700 border border-blue-200"
								: "text-gray-700 hover:bg-gray-100"
						}`}
					>
						<FileText size={16} />
						<span className="truncate">{doc.title}</span>
					</button>
				))}
			</div>
		</div>
	);
}
