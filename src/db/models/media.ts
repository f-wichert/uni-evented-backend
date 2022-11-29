import {
    CreationOptional,
    DataTypes,
    ForeignKey as ForeignKeyType,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
} from 'sequelize';
import {
    AllowNull,
    BelongsTo,
    Column,
    Default,
    ForeignKey,
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
    @ForeignKey(() => Event)
    @Column(DataTypes.UUID)
    declare eventId: ForeignKeyType<string>;

    @BelongsTo(() => Event)
    declare event?: NonAttribute<Event>;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column(DataTypes.UUID)
    declare userId: ForeignKeyType<string>;

    @BelongsTo(() => User)
    declare user?: NonAttribute<User>;
}
