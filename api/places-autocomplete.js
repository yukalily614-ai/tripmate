module.exports = async (req, res) => {
  const input = req.query.input;
  if (!input) {
    return res.status(400).json({ error: 'input is required' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY is not set' });
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input,
        languageCode: 'ja',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Google API error' });
    }

    const suggestions = (data.suggestions || [])
      .filter((s) => s.placePrediction)
      .map((s) => ({
        placeId: s.placePrediction.placeId,
        mainText:
          s.placePrediction.structuredFormat?.mainText?.text ||
          s.placePrediction.text?.text ||
          '',
        secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || '',
      }));

    res.status(200).json({ suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
};
