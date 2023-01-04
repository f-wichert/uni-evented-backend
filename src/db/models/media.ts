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
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Enum, ForeignUUIDColumn } from '../utils';
import Event from './event';
import User from './user';

const MediaTypes = ['image', 'video'] as const;
export type MediaType = typeof MediaTypes[number];

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

    // relationships

    @ForeignUUIDColumn(() => Event)
    declare eventId: ForeignKey<string>;

    @BelongsTo(() => Event)
    declare event?: NonAttribute<Event>;

    @ForeignUUIDColumn(() => User)
    declare userId: ForeignKey<string>;

    @BelongsTo(() => User)
    declare user?: NonAttribute<User>;
}
