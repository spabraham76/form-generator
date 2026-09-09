export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { base64Data, mediaType } = req.body;
  if (!base64Data || !mediaType) return res.status(400).json({ error: 'Missing fields' });

  const isDoc = mediaType === 'application/pdf';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: isDoc ? 'document' : 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data }
          },
          {
            type: 'text',
            text: `Analyze this form and extract ALL fillable fields. For each field return:
- label: exact field name shown
- type: text | email | phone | date | number | checkbox | radio | select | textarea | signature
- options: array (radio/select only)
- required: true/false
- placeholder: short hint text
- section: section heading this field belongs to (if any)

Respond ONLY with a valid JSON array. No preamble, no markdown, no backticks.`
          }
        ]
      }]
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
