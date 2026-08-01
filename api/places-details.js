module.exports = async (req, res) => {
  const placeId = req.query.placeId;
  if (!placeId) {
    return res.status(400).json({ error: 'placeId is required' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY is not set' });
  }

  // Places API (New) では、取得したいフィールドはクエリパラメータではなく
  // X-Goog-FieldMask ヘッダーで指定する必要があります(これが今回のバグの原因でした)。
  const fieldMask = [
    'id',
    'displayName',
    'formattedAddress',
    'internationalPhoneNumber',
    'nationalPhoneNumber',
    'regularOpeningHours',
    'currentOpeningHours',
    'websiteUri',
    'rating',
    'location'
  ].join(',');

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ja`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: (data && data.error && data.error.message) || 'Google API error',
      });
    }

    // 新旧どちらのプロパティ名が来ても拾えるように正規化してから返す
    const address = data.formattedAddress || data.address || '';
    const phone =
      data.internationalPhoneNumber ||
      data.nationalPhoneNumber ||
      data.phone ||
      '';
    const openingHoursObj =
      data.regularOpeningHours || data.currentOpeningHours || null;
    const hoursList = openingHoursObj && Array.isArray(openingHoursObj.weekdayDescriptions)
      ? openingHoursObj.weekdayDescriptions
      : [];
    const website = data.websiteUri || data.website || '';
    const rating = typeof data.rating === 'number' ? data.rating : null;
    const name = (data.displayName && data.displayName.text) || data.name || '';

    res.status(200).json({
      name,
      address,
      phone,
      hours: hoursList.join(' / '),
      website,
      rating,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
};
