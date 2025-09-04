import { z } from "zod";

const CreateIssueSchema = z.object({
	from: z.number(),
	to: z.number(),
	anchorText: z.string(),
	body: z.string(),
});

export type CreateIssueRequest = z.infer<typeof CreateIssueSchema>;

export async function createGitHubIssue(request: CreateIssueRequest) {
	const { from, to, anchorText, body } = CreateIssueSchema.parse(request);

	const token = process.env.GITHUB_TOKEN;
	const owner = process.env.GITHUB_OWNER;
	const repo = process.env.GITHUB_REPO;

	if (!token || !owner || !repo) {
		throw new Error(
			"Missing GitHub configuration. Please set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO environment variables.",
		);
	}

	const title = `[Comment] ${anchorText.substring(0, 30)}${anchorText.length > 30 ? "..." : ""}`;

	const issueBody = `Source: TipTap Comment PoC
Anchor:
> ${anchorText}

Position: from=${from}, to=${to}

Comment:
${body}`;

	const response = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/issues`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
			},
			body: JSON.stringify({
				title,
				body: issueBody,
				labels: ["tiptap-comment", "poc"],
			}),
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`GitHub API error: ${response.status} ${error}`);
	}

	const issue = await response.json();

	return {
		issueNumber: issue.number,
		issueUrl: issue.html_url,
	};
}
