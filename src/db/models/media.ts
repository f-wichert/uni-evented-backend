import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
} from 'sequelize';
import {
    AllowNull,
    BelongsTo,
    Column,
    Default,
    DefaultScope,
    Model,
    PrimaryKey,
    Scopes,
    Table,
} from 'sequelize-typescript';

import { pick } from '../../utils';
import { Enum, ForeignUUIDColumn } from '../utils';
import Event from './event';
import User from './user';

const MediaTypes = ['image', 'video', 'livestream'] as const;
export type MediaType = typeof MediaTypes[number];

export const publicMediaFields = ['id', 'type', 'fileAvailable', 'userId'] as const;

@DefaultScope(() => ({
    attributes: [...publicMediaFields],
}))
@Scopes(() => ({
    full: {},
}))
@Table
export default class Media extends Model<InferAttributes<Media>, InferCreationAttributes<Media>> {
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    @Enum(MediaTypes)
    @AllowNull(false)
    @Column(DataTypes.STRING)
    declare type: MediaType;

    @AllowNull(false)
    @Default(false)
    @Column(DataTypes.BOOLEAN)
    declare fileAvailable: CreationOptional<boolean>;

    /**
     * A one-time key to start a stream
     * After the stream has started this will be null forever
     */
    @AllowNull(true)
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare streamKey?: CreationOptional<string | null>;

    // relationships

    @ForeignUUIDColumn(() => Event)
    declare eventId: ForeignKey<string>;

    @BelongsTo(() => Event)
    declare event?: NonAttribute<Event>;

    @ForeignUUIDColumn(() => User)
    declare userId: ForeignKey<string>;

    @BelongsTo(() => User)
    declare user?: NonAttribute<User>;

    formatForResponse(opts?: { livestreamCreation?: boolean }) {
        const extraFields = opts?.livestreamCreation ? (['streamKey'] as const) : [];
        return pick(this, [...publicMediaFields, ...extraFields]);
    }
}
