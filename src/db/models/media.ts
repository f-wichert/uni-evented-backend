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
    ForeignKey as ForeignKeyDec,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import Event from './event';
import User from './user';

@Table
export default class Media extends Model<InferAttributes<Media>, InferCreationAttributes<Media>> {
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    @AllowNull(false)
    @Column(DataTypes.ENUM('image', 'video'))
    declare type: 'image' | 'video';

    @AllowNull(false)
    @Default(false)
    @Column(DataTypes.BOOLEAN)
    declare fileAvailable: CreationOptional<boolean>;

    @AllowNull(false)
    @Default(0)
    @Column(DataTypes.INTEGER)
    declare length: CreationOptional<number>;

    // relationships

    @AllowNull(false)
    @ForeignKeyDec(() => Event)
    @Column(DataTypes.UUID)
    declare eventId: ForeignKey<Event['id']>;

    @BelongsTo(() => Event)
    declare event?: NonAttribute<Event>;

    @AllowNull(false)
    @ForeignKeyDec(() => User)
    @Column(DataTypes.UUID)
    declare userId: ForeignKey<User['id']>;

    @BelongsTo(() => User)
    declare user?: NonAttribute<User>;
}
