module.exports = async (req, res) => {
  const input = req.query.input;
  if (!input) {
    return res.status(400).json({ error: 'input parameter is required' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not configured' });
  }

  try {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          input: input,
          languageCode: 'ja',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Autocomplete API Error:', data);
      return res.status(response.status).json(data);
    }

    // 安全にデータを取り出す処理
    const suggestions = data.suggestions || [];
    const predictions = suggestions.map((s) => {
      const p = s.placePrediction;
      if (!p) return null;

      const mainText = p.structuredFormat?.mainText?.text || p.text?.text || '';
      const secondaryText = p.structuredFormat?.secondaryText?.text || '';
      const description = secondaryText ? `${mainText} ${secondaryText}` : mainText;

      return {
        placeId: p.placeId || p.place,
        place_id: p.placeId || p.place,
        description: description,
        mainText: mainText,
        secondaryText: secondaryText,
        structured_formatting: {
          main_text: mainText,
          secondary_text: secondaryText,
        }
      };
    }).filter(Boolean);

    return res.status(200).json({ predictions });
  } catch (err) {
    console.error('Server Catch Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
