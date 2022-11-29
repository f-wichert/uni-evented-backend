import {
    DataTypes,
    ForeignKey as ForeignKeyType,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize';
import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import Event from './event';
import User from './user';

// n.b. This table doesn't *have* to be declared explicitly,
// we could also just have sequelize automatically infer the association table
// by using `"EventAttendee"` instead of `() => EventAttendee`.
// This way however, it'll be easier to add additional attributes to the association
// in case they're needed.

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
