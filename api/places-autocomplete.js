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
      console.error('Autocomplete Error:', data);
      return res.status(response.status).json(data);
    }

    // フロントエンドが placeId / place_id どちらでも読み取れるように変換して返す
    const predictions = (data.suggestions || []).map((s) => {
      const p = s.placePrediction;
      if (!p) return null;
      return {
        placeId: p.placeId,
        place_id: p.placeId, // 旧形式用のプロパティ名も同時にセット！
        description: p.text?.text || '',
        mainText: p.structuredFormat?.mainText?.text || p.text?.text || '',
        secondaryText: p.structuredFormat?.secondaryText?.text || '',
      };
    }).filter(Boolean);

    return res.status(200).json({ predictions });
  } catch (err) {
    console.error('Server Catch Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
