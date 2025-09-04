import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { NextResponse } from "next/server";

const CONTENTS_DIR = path.join(process.cwd(), "contents");

export async function GET() {
	try {
		const files = await fs.readdir(CONTENTS_DIR);
		const markdownFiles = files.filter((file) => file.endsWith(".md"));

		const documents = await Promise.all(
			markdownFiles.map(async (file) => {
				const filePath = path.join(CONTENTS_DIR, file);
				const content = await fs.readFile(filePath, "utf-8");
				const { data: frontmatter } = matter(content);

				return {
					slug: file.replace(".md", ""),
					title: frontmatter.title || file.replace(".md", "").replace("-", " "),
					filename: file,
				};
			}),
		);

		return NextResponse.json({ documents });
	} catch (error) {
		console.error("Error reading documents:", error);
		return NextResponse.json(
			{ error: "Failed to read documents" },
			{ status: 500 },
		);
	}
}
