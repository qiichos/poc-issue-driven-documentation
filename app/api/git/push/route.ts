import { exec } from "node:child_process";
import { NextRequest, NextResponse } from "next/server";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
	try {
		const { message } = await request.json();
		const commitMessage = message || "Update documentation";

		// Verify we're in a git repository
		await execAsync("git status");

		// Add all changes
		await execAsync("git add .");

		// Check if there are any changes to commit
		const { stdout: statusOutput } = await execAsync("git status --porcelain");
		
		if (!statusOutput.trim()) {
			return NextResponse.json({
				success: true,
				message: "No changes to commit",
				skipped: true,
			});
		}

		// Commit changes
		await execAsync(`git commit -m "${commitMessage}"`);

		// Push to remote
		const { stdout: pushOutput, stderr: pushError } = await execAsync("git push");

		return NextResponse.json({
			success: true,
			message: "Successfully pushed changes to GitHub",
			details: {
				commitMessage,
				pushOutput: pushOutput || pushError,
			},
		});
	} catch (error: any) {
		console.error("Git push error:", error);
		
		// Handle common git errors
		if (error.message.includes("nothing to commit")) {
			return NextResponse.json({
				success: true,
				message: "No changes to commit",
				skipped: true,
			});
		}

		if (error.message.includes("Authentication failed")) {
			return NextResponse.json(
				{
					error: "Git authentication failed. Please check your Git credentials.",
					details: error.message,
				},
				{ status: 401 },
			);
		}

		if (error.message.includes("not a git repository")) {
			return NextResponse.json(
				{
					error: "Not a Git repository. Please initialize Git first.",
					details: error.message,
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Failed to push changes",
				details: error.message,
			},
			{ status: 500 },
		);
	}
}