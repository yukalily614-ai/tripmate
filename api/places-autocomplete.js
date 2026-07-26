export default async function handler(req, res) {
  const { input } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: input,
        languageCode: 'ja',
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch places' });
  }
}
