export type MediaType = 'image' | 'video';

export interface equalizable {
    equals(a: this): boolean;
}

export type Coordinates = { lat: number; lon: number };
