const EARTH_RADIUS = 6371000; // m

function degToRad(deg: number): number {
    return (deg * Math.PI) / 180.0;
}

/**
 * Calculates the distance between two locations on earth,
 * `(lat1, lon1)` and `(lat2, lon2)` in meters.
 *
 * heavily inspired by:
 * https://www.geeksforgeeks.org/haversine-formula-to-find-distance-between-two-points-on-a-sphere/
 */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = degToRad(lat2 - lat1);
    const dLon = degToRad(lon2 - lon1);

    const rLat1 = degToRad(lat1);
    const rLat2 = degToRad(lat2);

    const a =
        Math.pow(Math.sin(dLat / 2.0), 2.0) +
        Math.pow(Math.sin(dLon / 2.0), 2.0) * Math.cos(rLat1) * Math.cos(rLat2);

    return EARTH_RADIUS * 2.0 * Math.asin(Math.sqrt(a));
}
