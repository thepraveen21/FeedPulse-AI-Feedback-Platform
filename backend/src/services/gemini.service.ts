import https from 'https';

export interface GeminiAnalysis {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number;
  summary: string;
  tags: string[];
}

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
         path: `/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
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

    // Log full response to debug
    console.log('Gemini raw response:', JSON.stringify(json, null, 2));

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      console.error('Gemini empty response:', json);
      return null;
    }

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: GeminiAnalysis = JSON.parse(cleaned);
    console.log('Gemini result:', parsed);
    return parsed;
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return null;
  }
};