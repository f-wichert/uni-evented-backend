import { Coordinates } from '../types';

const EARTH_RADIUS = 6371000; // m

function degToRad(deg: number): number {
    return (deg * Math.PI) / 180.0;
}

/**
 * Calculates the distance between two locations on earth,
 * coordinates_A and coordinates_B in meters.
 *
 * heavily inspired by:
 * https://www.geeksforgeeks.org/haversine-formula-to-find-distance-between-two-points-on-a-sphere/
 */
export function distanceInMeters(coordinates_A: Coordinates, coordinates_B: Coordinates): number {
    const dLat = degToRad(coordinates_B.lat - coordinates_A.lat);
    const dLon = degToRad(coordinates_B.lon - coordinates_A.lon);

    const rLat1 = degToRad(coordinates_A.lat);
    const rLat2 = degToRad(coordinates_B.lat);

    const a =
        Math.pow(Math.sin(dLat / 2.0), 2.0) +
        Math.pow(Math.sin(dLon / 2.0), 2.0) * Math.cos(rLat1) * Math.cos(rLat2);

    return EARTH_RADIUS * 2.0 * Math.asin(Math.sqrt(a));
}
