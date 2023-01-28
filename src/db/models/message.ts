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
    CreatedAt,
    Default,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { ForeignUUIDColumn } from '../utils';
import Event from './event';
import User from './user';

@Table
export default class Message extends Model<
    InferAttributes<Message>,
    InferCreationAttributes<Message>
> {
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    @AllowNull(false)
    @Column(DataTypes.STRING)
    declare message: string;

    @CreatedAt
    declare sendTime: CreationOptional<Date>;

    // relationships

    @ForeignUUIDColumn(() => User)
    declare senderId: ForeignKey<string>;
    @BelongsTo(() => User)
    declare sender?: NonAttribute<User>;

    @ForeignUUIDColumn(() => Event)
    declare eventId: ForeignKey<string>;
    @BelongsTo(() => Event)
    declare event?: NonAttribute<Event>;
}
