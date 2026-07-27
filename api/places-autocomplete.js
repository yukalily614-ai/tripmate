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
    // 確実に動く旧方式の API エンドポイントを使用
    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&language=ja&key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('Autocomplete API Network Error:', data);
      return res.status(response.status).json(data);
    }

    if (data.status === 'OK' && data.predictions) {
      // フロントエンドが読み取れる旧形式・新形式両方のプロパティ名で返す
      const predictions = data.predictions.map((p) => {
        return {
          placeId: p.place_id,
          place_id: p.place_id,
          description: p.description,
          mainText: p.structured_formatting?.main_text || '',
          secondaryText: p.structured_formatting?.secondary_text || '',
          raw: p
        };
      });
      return res.status(200).json({ predictions });
    }

    // Googleから「OK」以外が返ってきた場合
    console.error('Autocomplete API Status Error:', data);
    return res.status(200).json({ predictions: [], error: data.status, message: data.error_message });

  } catch (err) {
    console.error('Server Catch Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
