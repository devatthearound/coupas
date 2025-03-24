import OpenAI from "openai";
const openai = new OpenAI();

export const chatGpt = async (prompt: string) => {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
        {
            role: "user",
            content: prompt,
        },
        ],
        store: true,
    });

    return completion.choices[0].message;
};