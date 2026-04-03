import https from 'https';

export interface GeminiAnalysis {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number;
  summary: string;
  tags: string[];
}

const smartFallback = (title: string, description: string): GeminiAnalysis => {
  const text = (title + ' ' + description).toLowerCase();

  const isNegative =
    text.includes('crash') || text.includes('broken') ||
    text.includes('error') || text.includes('bug') ||
    text.includes('fail') || text.includes('not working') ||
    text.includes('damage') || text.includes('slow') ||
    text.includes('issue') || text.includes('problem');

  const isPositive =
    text.includes('great') || text.includes('love') ||
    text.includes('amazing') || text.includes('excellent') ||
    text.includes('brilliant') || text.includes('awesome') ||
    text.includes('perfect') || text.includes('fantastic');

  const sentiment = isNegative ? 'Negative' : isPositive ? 'Positive' : 'Neutral';
  const priority = isNegative ? 8 : isPositive ? 4 : 5;

  const words = title
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(' ')
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

  return {
    category: 'Improvement',
    sentiment,
    priority_score: priority,
    summary: `${title} — ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}`,
    tags: words.length > 0 ? words : ['Feedback', 'User Request'],
  };
};

export const analyzeFeedback = async (
  title: string,
  description: string
): Promise<GeminiAnalysis | null> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = `Analyse this product feedback. Return ONLY valid JSON with no markdown, no code blocks, no extra text.

Title: ${title}
Description: ${description}

Return exactly this JSON structure:
{
  "category": "Bug or Feature Request or Improvement or Other",
  "sentiment": "Positive or Neutral or Negative",
  "priority_score": a number from 1 to 10,
  "summary": "one sentence summary of the feedback",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    });

    const result = await new Promise<string>((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'generativelanguage.googleapis.com',
          path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    const json = JSON.parse(result);

    console.log('Gemini raw response:', JSON.stringify(json, null, 2));

    // Quota exhausted — use smart fallback
    if (json.error?.code === 429) {
      console.log('Quota exhausted — using smart fallback');
      return smartFallback(title, description);
    }

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    // Empty response — use smart fallback
    if (!text) {
      console.log('Empty response — using smart fallback');
      return smartFallback(title, description);
    }

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: GeminiAnalysis = JSON.parse(cleaned);
    console.log('Gemini result:', parsed);
    return parsed;
  } catch (error) {
    console.error('Gemini analysis error:', error);
    console.log('Error occurred — using smart fallback');
    return smartFallback(title, description);
  }
};