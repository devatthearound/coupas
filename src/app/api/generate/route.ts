import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: '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'
}); // 수정된 부분

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Generate a video title and script for the following product information: ${prompt}`,
        },
        {
          role: "user",
          content: `Generate a video title and script for the following product information: ${prompt}`,
        },
        {
          role: "user",
          content: `Generate a video title and script for the following product information: ${prompt}`,
        },
        {
          role: "user",
          content: `Generate a video title and script for the following product information: ${prompt}`,
        },
      ],
    });

    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    const [title, ...scriptLines] = messageContent.split('\n');
    const script = scriptLines.join('\n');

    return NextResponse.json({ result: { title, script } });

  } catch (error) {
    return NextResponse.json({ error: 'Error generating text' }, { status: 500 });
  }
} 