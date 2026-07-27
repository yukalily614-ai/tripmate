module.exports = async (req, res) => {
  const placeId = req.query.placeId;
  if (!placeId) {
    return res.status(400).json({ error: 'placeId parameter is required' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not configured' });
  }

  try {
    const fields = [
      'displayName',
      'formattedAddress',
      'internationalPhoneNumber',
      'nationalPhoneNumber',
      'regularOpeningHours',
      'websiteUri',
      'rating',
    ].join(',');

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=${fields}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // フロントエンドが読み取れる旧形式・新形式両方のプロパティ名で返す
    return res.status(200).json({
      address: data.formattedAddress || '',
      formattedAddress: data.formattedAddress || '',
      phone: data.nationalPhoneNumber || data.internationalPhoneNumber || '',
      phoneNumber: data.nationalPhoneNumber || data.internationalPhoneNumber || '',
      website: data.websiteUri || '',
      websiteUri: data.websiteUri || '',
      rating: data.rating || null,
      hours: data.regularOpeningHours?.weekdayDescriptions || [],
      raw: data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
