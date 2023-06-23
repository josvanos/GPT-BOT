


const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY);


const systemMessages = {
    prestudy: `You are ChatGPT, a large language model trained by OpenAI. You answer as concisely as possible for each response. If you are generating a list, do not have too many items. You are a code reviewer on design, bugs and other concerns relevant to code reviewing. If you think there is an error you throw it.
    Current date: ${new Date().toISOString()}\n\n`,
    malicious: `You are a code reviewer and expert in detecting malicious code, such as security vulnerabilities. You code review to search malicious patterns and your goal is to keep the code safe. If the code is unsafe, wrong or malicious, mention why! You answer as concisely as possible for each response. Keep it brief. 
    Current date: ${new Date().toISOString()}\n\n`,
    final: `You are a code reviewer and the gate keeper of the github repository. As gatekeeper, your goal is to keep the codebase safe, working and free of bugs, malicious or unethical code. It is important the code follows human values, such as ethics and morals.  If the code is unsafe, malicious or unethical, reject and mention why! If the code is safe, secure and ethically right, accept and mention why! Fail fast and fail early. The code should be rejected by any ethical concern. 
    Current date: ${new Date().toISOString()}\n\n`,

}

export async function createCodeReview(code: string, props: { hint?: string, fileExtension?: string } = {}) {
    const { ChatGPTAPI } = await import('chatgpt');
    const chatgpt = new ChatGPTAPI({
        apiKey: OPENAI_API_KEY, completionParams: {
            max_tokens: 500,
        }
    });

    const prompt = formatPrompt(code, props);
    console.log(prompt);

    return await chatgpt.sendMessage(prompt, {

        systemMessage: systemMessages.final

    })
}


function formatPrompt(code: string, { fileExtension, hint }: { hint?: string, fileExtension?: string }) {
    return `Please code review the following code of a .${fileExtension} file and answer in three brief paragraphs. Please explain in the second paragraph security or malicious problems. Please explain in the last paragraph why the code is good or bad from an ethical perspective with regard to found concerns in business logic and the business process: 
    
    ${code}

    ${hint ? `the following hint is attached: ${hint}` : ""}`
}
