export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { base64Data, mediaType } = req.body;
  if (!base64Data || !mediaType) return res.status(400).json({ error: 'Missing fields' });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          {
            type: 'text',
            text: `This is one page of a paper form. Find every blank area a person would write in: blank lines, empty boxes, checkboxes, signature lines, date fields.

For each one return its position as PERCENTAGES of the full page (0-100), measured from the top-left corner:
- label: the nearest text label describing the blank
- type: "text" (single line), "textarea" (multi-line box), "checkbox" (small square to tick), or "signature"
- x: left edge %, y: top edge %, w: width %, h: height %

Place the box exactly over the blank writing area, NOT over the printed label. Be precise. Checkboxes should be small squares (about 1.5-2.5% wide).

Respond ONLY with a valid JSON array, no preamble, no markdown, no backticks. Example:
[{"label":"Patient Name","type":"text","x":22.5,"y":14.2,"w":40,"h":2.4},{"label":"Yes","type":"checkbox","x":60.1,"y":30.5,"w":2,"h":1.6}]`
          }
        ]
      }]
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
