import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Missing imageBase64" },
        { status: 400 }
      );
    }

    // Call OpenAI Vision API with gpt-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: "You are a landmark detection expert. Analyze this image and identify the landmark. Return ONLY a valid JSON object with no markdown, no backticks, no explanation in this exact format: { \"name\": \"Landmark Name\", \"location\": \"City, Country\", \"historicalFacts\": [\"fact1\",\"fact2\",\"fact3\",\"fact4\"], \"interestingDetails\": [\"detail1\",\"detail2\",\"detail3\",\"detail4\"], \"travelTips\": [\"tip1\",\"tip2\",\"tip3\",\"tip4\"] } — if no landmark detected return { \"error\": \"No landmark detected\" }",
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Parse the JSON response
    const analysisData = JSON.parse(content);

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error("Vision API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
