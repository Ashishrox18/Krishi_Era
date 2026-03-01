import { LocationClient, CalculateRouteCommand, SearchPlaceIndexForTextCommand } from '@aws-sdk/client-location';

const client = new LocationClient({ region: process.env.AWS_REGION });

export class LocationService {
  async calculateRoute(origin: [number, number], destination: [number, number]) {
    const command = new CalculateRouteCommand({
      CalculatorName: 'KrishiRouteCalculator',
      DeparturePosition: origin,
      DestinationPosition: destination,
      TravelMode: 'Truck',
      DistanceUnit: 'Kilometers',
    });

    const response = await client.send(command);
    const leg = response.Legs?.[0];

    return {
      distance: leg?.Distance || 0,
      duration: leg?.DurationSeconds || 0,
      geometry: leg?.Geometry,
    };
  }

  async optimizeMultiStopRoute(origin: [number, number], waypoints: [number, number][]) {
    const routes = [];
    
    for (const waypoint of waypoints) {
      const route = await this.calculateRoute(origin, waypoint);
      routes.push({
        destination: waypoint,
        ...route,
      });
    }

    // Sort by distance for simple optimization
    routes.sort((a, b) => a.distance - b.distance);

    return {
      optimizedRoute: routes,
      totalDistance: routes.reduce((sum, r) => sum + r.distance, 0),
      totalDuration: routes.reduce((sum, r) => sum + r.duration, 0),
    };
  }

  async geocodeAddress(address: string) {
    const command = new SearchPlaceIndexForTextCommand({
      IndexName: 'KrishiPlaceIndex',
      Text: address,
      MaxResults: 1,
    });

    const response = await client.send(command);
    const result = response.Results?.[0];

    if (result?.Place?.Geometry?.Point) {
      return {
        coordinates: result.Place.Geometry.Point as [number, number],
        label: result.Place.Label,
      };
    }

    return null;
  }
}

export const locationService = new LocationService();
