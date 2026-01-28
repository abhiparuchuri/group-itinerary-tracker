const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

export interface City {
  id: string;
  name: string;
  fullName: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export async function searchCities(query: string): Promise<City[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          types: 'place,locality',
          limit: '5',
        })
    );

    if (!response.ok) {
      console.error('Mapbox geocoding error:', response.status);
      return [];
    }

    const data = await response.json();

    return data.features.map((feature: any) => {
      // Extract state/region and country from context
      const regionContext = feature.context?.find((c: any) => c.id?.startsWith('region'));
      const countryContext = feature.context?.find((c: any) => c.id?.startsWith('country'));
      const state = regionContext?.text || '';
      const country = countryContext?.text || '';

      return {
        id: feature.id,
        name: feature.text,
        fullName: feature.place_name,
        state,
        country,
        latitude: feature.center[1],
        longitude: feature.center[0],
      };
    });
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}

export interface Place {
  id: string;
  name: string;
  address: string;
  category: 'food' | 'attraction' | 'transport' | 'lodging' | 'other';
  latitude: number;
  longitude: number;
}

export async function searchPlaces(
  query: string,
  proximity?: { latitude: number; longitude: number }
): Promise<Place[]> {
  if (!query || query.length < 2) return [];

  try {
    const params: Record<string, string> = {
      access_token: MAPBOX_TOKEN,
      types: 'poi,address',
      limit: '10',
    };

    if (proximity) {
      params.proximity = `${proximity.longitude},${proximity.latitude}`;
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        new URLSearchParams(params)
    );

    if (!response.ok) {
      console.error('Mapbox geocoding error:', response.status);
      return [];
    }

    const data = await response.json();

    return data.features.map((feature: any) => {
      // Try to determine category from feature properties
      const categories = feature.properties?.category?.split(', ') || [];
      let category: Place['category'] = 'other';

      if (categories.some((c: string) => c.includes('food') || c.includes('restaurant') || c.includes('cafe'))) {
        category = 'food';
      } else if (categories.some((c: string) => c.includes('hotel') || c.includes('lodging'))) {
        category = 'lodging';
      } else if (categories.some((c: string) => c.includes('museum') || c.includes('park') || c.includes('landmark') || c.includes('attraction'))) {
        category = 'attraction';
      } else if (categories.some((c: string) => c.includes('station') || c.includes('airport') || c.includes('transport'))) {
        category = 'transport';
      }

      return {
        id: feature.id,
        name: feature.text,
        address: feature.place_name,
        category,
        latitude: feature.center[1],
        longitude: feature.center[0],
      };
    });
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}
