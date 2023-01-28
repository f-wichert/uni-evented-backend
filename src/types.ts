import { BelongsToManyGetAssociationsMixinOptions, IncludeThroughOptions } from 'sequelize';

export type MediaType = 'image' | 'video';

export interface equalizable {
    equals(a: this): boolean;
}

export type Coordinates = { lat: number; lon: number };

// `through` is missing from the type definitions, but works fine
export type BelongsToManyGetAssociationsMixinFixed<TModel> = (
    options?: BelongsToManyGetAssociationsMixinOptions & { through?: IncludeThroughOptions },
) => Promise<TModel[]>;
