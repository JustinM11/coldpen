import Anthropic from "@anthropic-ai/sdk";
import { AppError } from "../middleware/errorHandler.js";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert cold outreach email copywriter with 15 years of experience. You write emails that actually get replies.

Your rules:
1. NEVER start with "I hope this email finds you well" or "My name is..."
2. Start with something specific to the recipient's pain point or a compelling insight
3. Keep emails between 75-150 words. Every sentence must earn its place
4. Use specific numbers and results when possible. "Helped 200+ companies increase reply rates by 3x" beats "We help companies grow"
5. One clear call-to-action. "Worth a 15-minute chat?" beats "Please schedule a meeting at your earliest convenience"
6. Match the requested tone precisely

NEVER do these:
- "Just following up" or "Just checking in"
- Excessive exclamation marks
- Generic compliments like "I love what you're doing!"
- More than one call-to-action
- Paragraphs longer than 3 sentences
- Pushy or desperate language

You must respond ONLY with valid JSON in this exact format, no markdown, no backticks, no extra text:
{
  "variations": [
    {
      "label": "2-4 word strategy name like Pain Point Lead or Social Proof Hook",
      "subject": "email subject line, 3-7 words",
      "body": "full email body with line breaks as newline characters",
      "strategy": "one sentence explaining why this approach works"
    }
  ]
}

Generate exactly 3 variations. Each must use a DIFFERENT persuasion strategy. Not just rewording — different approaches. For example: one leads with a pain point, one with social proof, one with a provocative question.`;

function getMockResponse() {
  return {
    variations: [
      {
        label: "Pain Point Lead",
        subject: "Your team is losing 10 hours/week to manual reporting",
        body: "Hi there,\n\nI noticed your team is scaling fast — which usually means reporting becomes a bottleneck before anyone realizes it.\n\nWe built a tool that automates the dashboards your ops team builds manually every Monday. Our clients typically reclaim 10+ hours per week.\n\nWorth a quick 15-minute call to see if it fits?\n\nBest,\nAlex",
        strategy:
          "Opens with a specific, quantified pain point the reader likely experiences.",
      },
      {
        label: "Social Proof Hook",
        subject: "How Stripe and Linear cut reporting time by 60%",
        body: "Hi there,\n\nCompanies like Stripe and Linear use automated reporting to move faster. Their ops teams stopped building dashboards manually — and saved 60% of the time they used to spend on it.\n\nWe help teams do the same thing, typically in under a week to set up.\n\nOpen to a brief chat this week?\n\nBest,\nAlex",
        strategy:
          "Leads with recognizable company names to build immediate credibility.",
      },
      {
        label: "Direct Value Prop",
        subject: "Automated dashboards for your team",
        body: "Hi there,\n\nOne question: what if your Monday morning dashboards built themselves?\n\nThat is what we do. Plug into your existing data sources, and every report your team builds manually today gets auto-generated — accurate, formatted, and delivered before your first coffee.\n\n15 minutes to show you how?\n\nBest,\nAlex",
        strategy:
          "Opens with a compelling question that paints a vivid before/after picture.",
      },
    ],
    usage: { inputTokens: 0, outputTokens: 0 },
  };
}

export async function generateColdEmails({
  productDescription,
  targetAudience,
  tone,
  ctaGoal,
}) {
  if (!productDescription || !targetAudience || !tone || !ctaGoal) {
    throw new AppError("All fields are required", 400, "VALIDATION_ERROR");
  }
  if (process.env.MOCK_AI === "true") {
    return getMockResponse();
  }

  const userPrompt = `Generate 3 cold email variations with these parameters:

PRODUCT/SERVICE: ${productDescription}

TARGET AUDIENCE: ${targetAudience}

TONE: ${tone}

CALL-TO-ACTION GOAL: ${ctaGoal}

Remember: each variation must use a different persuasion strategy. Respond with JSON only.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = response.content[0].text;

    const cleaned = rawText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.variations || parsed.variations.length !== 3) {
      throw new Error("Invalid response structure");
    }

    const usage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };

    return { variations: parsed.variations, usage };
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (error instanceof SyntaxError) {
      throw new AppError(
        "AI generated an invalid response. Please try again.",
        502,
        "AI_PARSE_ERROR",
      );
    }

    if (error?.status === 429) {
      throw new AppError(
        "AI rate limit exceeded. Try again in a moment.",
        429,
        "AI_RATE_LIMIT",
      );
    }

    console.error("Claude API error:", error.message);
    throw new AppError(
      "Failed to generate emails. Please try again.",
      502,
      "AI_SERVICE_ERROR",
    );
  }
}
