import { Context, Probot } from "probot";
import { createCodeReview } from "./chatgpt";
//@ts-ignore
const parseSentence = require('minimist-string');
export const codeReviewBot = (app: Probot) => {
    // on new pull request - perform code review
    // @ts-ignore
    app.on("pull_request.opened", async (ctx) => {
        try {
            const { file, commits } = await getFileOfBaseHead(ctx, { base: ctx.payload.pull_request.base.sha, head: ctx.payload.pull_request.head.sha });
            const res = await createCodeReview(file.patch || "", { fileExtension: file.filename.split(".").pop() });
            await createComment(ctx, file, commits, res.text);

            return true;
        } catch (error) {
            console.log("Could not create code review", error);
            return false;
        }
    });


    // on comment '/code-review' 
    const COMMAND = "\\code-review";

    // @ts-ignore
    app.on("issue_comment.created", async (ctx) => {
        if (ctx.isBot) return console.log("comment ignored - bot detected");
        const message = ctx.payload.comment.body;

        const isCommand = message.startsWith(COMMAND);
        if (!isCommand) return console.log("The comment was no command");

        const commandArguments = message.replace(COMMAND, "");
        const args = parseSentence(commandArguments)

        const { file, commits } = await getFileOfPullRequest(ctx);

        const res = await createCodeReview(file.patch || "", { fileExtension: file.filename.split('.').pop(), hint: args.hint });
        await createComment(ctx, file, commits, res.text);

        return "success";
    });

};

async function getFileOfPullRequest(ctx: Context) {
    const pull_number = ctx.pullRequest().pull_number;
    const repo = ctx.repo();

    const pull = await ctx.octokit.pulls.get({ repo: repo.repo, owner: repo.owner, pull_number })
    return await getFileOfBaseHead(ctx, { base: pull.data.base.sha, head: pull.data.head.sha })
}

async function getFileOfBaseHead(ctx: Context, { base, head }: { base: string, head: string }) {
    const repo = ctx.repo();

    const data = await ctx.octokit.repos.compareCommits({
        owner: repo.owner,
        repo: repo.repo,
        base,
        head,
    });

    let { files, commits } = data.data;

    if (!files?.[0]) throw new Error("[Pull Request] Could not find file changes");
    const file = files[0];

    file.patch = file.patch?.replace('\\ No newline at end of file', '')
    return { file, commits };

}

//https://stackoverflow.com/questions/4351521/how-do-i-pass-command-line-arguments-to-a-node-js-program
function parseArguments(command: string) {
    const args: any = {};
    //https://stackoverflow.com/questions/19156148/i-want-to-remove-double-quotes-from-a-string
    const removeQuotes = (x: string) => x.replace(/^"(.*)"$/, '$1');

    for (const part of command.split(" ")) {
        if (part.slice(0, 2) === '--') {
            const longArg = part.split('=');
            const longArgFlag = longArg[0].slice(2, longArg[0].length);
            const longArgValue = longArg[1];
            args[longArgFlag] = removeQuotes(longArgValue);
        }
    }


    return args



};





async function createComment(ctx: Context, file: any, commits: any[], message: string) {
    const repo = ctx.repo();

    return await ctx.octokit.pulls.createReviewComment({
        repo: repo.repo,
        owner: repo.owner,
        pull_number: ctx.pullRequest().pull_number,
        body: message,
        path: file.filename,
        commit_id: commits[commits.length - 1].sha,
        position: file.patch.split('\n').length - 1,

    })
}



