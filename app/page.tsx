"use client";

import React, { useEffect, useState } from "react";
import CommentModal from "@/components/CommentModal";
import DocumentEditor from "@/components/DocumentEditor";
import DocumentList from "@/components/DocumentList";
import Sidebar from "@/components/Sidebar";

export type Comment = {
	id: string;
	from: number;
	to: number;
	anchorText: string;
	issueNumber: number;
	issueUrl: string;
};

interface Document {
	slug: string;
	title: string;
	filename: string;
}

interface DocumentData {
	slug: string;
	title: string;
	content: string;
	frontmatter: Record<string, unknown>;
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(null, args), delay);
	};
}

export default function Home() {
	const [comments, setComments] = useState<Comment[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedText, setSelectedText] = useState<{
		from: number;
		to: number;
		text: string;
	} | null>(null);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
	const [currentDocument, setCurrentDocument] = useState<DocumentData | null>(
		null,
	);
	const [documentContent, setDocumentContent] = useState<string>("");
	const [isLoadingDocument, setIsLoadingDocument] = useState<boolean>(false);

	// Load document list
	useEffect(() => {
		const loadDocuments = async () => {
			try {
				const response = await fetch("/api/documents");
				const data = await response.json();
				setDocuments(data.documents);

				// Select first document by default
				if (data.documents.length > 0) {
					setSelectedDocument(data.documents[0].slug);
				}
			} catch (error) {
				console.error("Failed to load documents:", error);
			}
		};

		loadDocuments();
	}, []);

	// Load selected document content
	useEffect(() => {
		const loadDocument = async () => {
			if (!selectedDocument) return;

			setIsLoadingDocument(true);
			try {
				const response = await fetch(`/api/documents/${selectedDocument}`);
				const data = await response.json();
				setCurrentDocument(data);
				setDocumentContent(data.content);
			} catch (error) {
				console.error("Failed to load document:", error);
			} finally {
				setIsLoadingDocument(false);
			}
		};

		loadDocument();
	}, [selectedDocument]);

	const handleDocumentSelect = (slug: string) => {
		setSelectedDocument(slug);
		// Clear comments when switching documents
		setComments([]);
	};

	const handleContentChange = (newContent: string) => {
		setDocumentContent(newContent);

		// Auto-save with debounce
		if (selectedDocument) {
			debouncedSave(selectedDocument, newContent);
		}
	};

	// Debounced save function
	const debouncedSave = React.useCallback(
		debounce(async (slug: string, content: string) => {
			try {
				await fetch(`/api/documents/${slug}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						content,
						frontmatter: currentDocument?.frontmatter || {},
					}),
				});
				console.log("Document auto-saved");
			} catch (error) {
				console.error("Failed to auto-save document:", error);
			}
		}, 1000),
		[],
	);

	const handleAddComment = (comment: Comment) => {
		setComments([...comments, comment]);
		setIsModalOpen(false);
		setSelectedText(null);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white border-b border-gray-200 px-4 py-3">
				<h1 className="text-xl font-semibold text-gray-900">
					{currentDocument ? currentDocument.title : "Editor PoC"}
				</h1>
			</header>

			<div className="flex h-[calc(100vh-60px)] text-black">
				<DocumentList
					documents={documents}
					selectedDocument={selectedDocument}
					onDocumentSelect={handleDocumentSelect}
				/>

				<div className="flex-1 p-4">
					{currentDocument && !isLoadingDocument ? (
						<DocumentEditor
							key={selectedDocument} // Force re-create editor when document changes
							content={documentContent}
							comments={comments}
							onContentChange={handleContentChange}
							onCommentClick={(from, to, text) => {
								setSelectedText({ from, to, text });
								setIsModalOpen(true);
							}}
						/>
					) : (
						<div className="flex items-center justify-center h-full text-gray-500">
							{isLoadingDocument ? "Loading document..." : "Select a document to start editing"}
						</div>
					)}
				</div>

				<div className="w-80 border-l border-gray-200">
					<Sidebar comments={comments} />
				</div>
			</div>

			<CommentModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setSelectedText(null);
				}}
				selectedText={selectedText}
				onAddComment={handleAddComment}
			/>
		</div>
	);
}
