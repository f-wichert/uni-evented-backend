import {
    DataTypes,
    ForeignKey as ForeignKeyType,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize';
import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Event from './event';
import User from './user';

@Table({ timestamps: false })
export default class EventAttendee extends Model<
    InferAttributes<EventAttendee>,
    InferCreationAttributes<EventAttendee>
> {
    @ForeignKey(() => User)
    @Column(DataTypes.UUID)
    declare userId: ForeignKeyType<User['id']>;

    @ForeignKey(() => Event)
    @Column(DataTypes.UUID)
    declare eventId: ForeignKeyType<Event['id']>;
}
