import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { type NextRequest, NextResponse } from "next/server";

const CONTENTS_DIR = path.join(process.cwd(), "contents");

export async function GET(
	_request: NextRequest,
	{ params }: { params: { slug: string } },
) {
	try {
		const { slug } = params;
		const filePath = path.join(CONTENTS_DIR, `${slug}.md`);

		const content = await fs.readFile(filePath, "utf-8");
		const { data: frontmatter, content: markdownContent } = matter(content);

		return NextResponse.json({
			slug,
			title: frontmatter.title || slug.replace("-", " "),
			content: markdownContent,
			frontmatter,
		});
	} catch (error) {
		console.error("Error reading document:", error);
		return NextResponse.json({ error: "Document not found" }, { status: 404 });
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { slug: string } },
) {
	try {
		const { slug } = params;
		const { content: markdownContent, frontmatter = {} } = await request.json();

		const filePath = path.join(CONTENTS_DIR, `${slug}.md`);

		// Combine frontmatter and content
		const fileContent = matter.stringify(markdownContent, frontmatter);

		await fs.writeFile(filePath, fileContent, "utf-8");

		return NextResponse.json({
			success: true,
			message: "Document updated successfully",
		});
	} catch (error) {
		console.error("Error updating document:", error);
		return NextResponse.json(
			{ error: "Failed to update document" },
			{ status: 500 },
		);
	}
}
