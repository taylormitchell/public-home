import fs from "fs";

const all_issues_file = "./src/assets/all-react-issues.json";
const open_issues_file = "./src/assets/open-react-issues.json";
const all_issues_simple_file = "./src/assets/all-react-issues-simple.json";

async function downloadIssues() {
  let allIssues: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const promises: Promise<any>[] = [];
    for (let i = 0; i < 20 && hasMore; i++) {
      promises.push(
        fetch(
          `https://api.github.com/repos/facebook/react/issues?state=all&page=${
            page + i
          }&per_page=100`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer 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`,
              "X-GitHub-Api-Version": "2022-11-28",
            },
          }
        ).then((res) => res.json())
      );
    }

    const results = await Promise.all(promises);

    for (const data of results) {
      if (data.length === 0) {
        hasMore = false;
      } else {
        allIssues = [...allIssues, ...data];
      }
    }

    page += promises.length;
  }
  fs.writeFileSync(all_issues_file, JSON.stringify(allIssues, null, 2));
}

async function createSmallerIssues() {
  const allIssues = JSON.parse(fs.readFileSync(all_issues_file, "utf8"));
  const allIssuesSimple = allIssues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    url: issue.html_url,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    labels: issue.labels.map((label) => label.name),
    state: issue.state,
    body: issue.body,
    user: issue.user.login,
  }));
  fs.writeFileSync(all_issues_simple_file, JSON.stringify(allIssuesSimple, null, 2));
}

createSmallerIssues();
