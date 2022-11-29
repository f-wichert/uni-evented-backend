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

import { Event } from './event';
import { User } from './user';

@Table
export class Clip extends Model<InferAttributes<Clip>, InferCreationAttributes<Clip>> {
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    @AllowNull(false)
    @Default(false)
    @Column(DataTypes.BOOLEAN)
    declare fileAvailable: CreationOptional<boolean>;

    @AllowNull(false)
    @Default(0)
    @Column(DataTypes.INTEGER)
    declare length: CreationOptional<number>;

    @AllowNull(false)
    @ForeignKeyDec(() => Event)
    @Column(DataTypes.STRING)
    declare eventId: ForeignKey<Event['id']>;

    @BelongsTo(() => Event)
    declare event?: NonAttribute<Event>;

    @AllowNull(false)
    @ForeignKeyDec(() => User)
    @Column(DataTypes.STRING)
    declare uploaderId: ForeignKey<User['id']>;

    @BelongsTo(() => User)
    declare uploader?: NonAttribute<User>;
}

export default Clip;
