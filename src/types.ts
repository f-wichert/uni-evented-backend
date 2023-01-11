export type MediaType = 'image' | 'video';

export interface equalizable {
    equals(a: this): boolean;
}
