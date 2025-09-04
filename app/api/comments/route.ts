import { type NextRequest, NextResponse } from "next/server";
import { createGitHubIssue } from "@/lib/github";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const result = await createGitHubIssue(body);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating GitHub issue:", error);

		const message = error instanceof Error ? error.message : "Unknown error";
		const status = message.includes("Missing GitHub configuration") ? 500 : 400;

		return NextResponse.json({ error: message }, { status });
	}
}
