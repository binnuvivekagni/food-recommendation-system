export const getNearbyRestaurants = async (payload) => {
  const { latitude, longitude, foodItem } = payload;
  console.log(latitude, longitude, foodItem);

  if (!latitude || !longitude) {
    return { status: 400, error: 'Latitude and Longitude are required.' };
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places:searchText?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textQuery: `${foodItem} restaurant`,
          locationBias: {
            circle: {
              center: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              },
              radius: 1000.0,
            },
          },
          maxResultCount: 5,
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Places API Error:', errorData?.error?.message || response.statusText);
      return { status: response.status, error: errorData?.error?.message || 'Failed to fetch nearby restaurants.' };
    }

    const data = await response.json();

    if (!data || !data.places) {
      console.error('Google Places API Error: No data or places found.');
      return { status: 500, error: 'No data or places found.' };
    }

    const restaurants = data.places.map((place) => {
      // console.log("place_id:", place.id);

      let photoUrl = null;
      if (place.photos && place.photos.length > 0) {
        const photoName = place.photos[0].name;
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${process.env.GOOGLE_API_KEY}`;
      }

      // Construct the directions URL using latitude and longitude
      const restaurantLatitude = place.location.latitude;
      const restaurantLongitude = place.location.longitude;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${restaurantLatitude},${restaurantLongitude}`;
      // console.log("directionsUrl:", directionsUrl);

      return {
        name: place.displayName?.text || 'Unknown',
        rating: place.rating,
        price_level: place.priceLevel,
        photoUrl: photoUrl,
        address: place.formattedAddress,
        directionsUrl: directionsUrl,
        is_open: place.openingHours?.openNow ?? null,
      };
    });

    return { data: restaurants };
  } catch (error) {
    console.error('Google Places API Error:', error.message);
    return { status: 500, error: 'Failed to fetch nearby restaurants.' };
  }
};