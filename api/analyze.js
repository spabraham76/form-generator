export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { base64Data, mediaType, words } = req.body;
  if (!base64Data || !mediaType) return res.status(400).json({ error: 'Missing fields' });

  const wordBlock = (words && words.length)
    ? `\n\nHere are the exact positions of every printed word on this page, as JSON (x, y = top-left corner in %, w, h = size in %). Use these as ground truth to anchor your field boxes precisely next to the correct labels:\n${JSON.stringify(words)}`
    : `\n\n(No embedded text available — this is a scanned image. Estimate positions carefully from the picture.)`;

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
- label: the nearest printed text label describing the blank
- type: "text" (single line), "textarea" (multi-line box), "checkbox" (small square to tick), or "signature"
- x: left edge %, y: top edge %, w: width %, h: height %

Rules:
- Place each box over the blank WRITING area (the empty space or line), NOT over the printed label text.
- A blank line usually sits just to the RIGHT of its label, or just BELOW it. Use the word positions to find where the label ends, then place the field in the adjacent empty space.
- Match a text field's height to the label's height (about 2-2.5%). Checkboxes are small squares (about 1.5-2.5% wide and tall).
- Do not overlap two fields.${wordBlock}

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
