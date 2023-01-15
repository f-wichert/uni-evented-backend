import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize';
import { AllowNull, Column, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { ForeignUUIDColumn } from '../utils';
import Event from './event';
import User from './user';

const EventStatuses = ['scheduled', 'active', 'completed'] as const;
type EventStatus = typeof EventStatuses[number];

@Table
export default class Message extends Model<
    InferAttributes<Message>,
    InferCreationAttributes<Message>
> {
    [x: string]: any;

    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    @AllowNull(false)
    @Column(DataTypes.STRING)
    declare message: string;

    @AllowNull(false)
    @Default(DataTypes.NOW())
    @Column
    declare sendTime: Date;

    // relationships

    @ForeignUUIDColumn(() => User)
    declare messageCorrespondent: ForeignKey<string>;

    @ForeignUUIDColumn(() => Event)
    declare eventId: ForeignKey<string>;
}
