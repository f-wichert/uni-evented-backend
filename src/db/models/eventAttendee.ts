import { ForeignKey, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Model, Table } from 'sequelize-typescript';

import { ForeignUUIDColumn } from '../utils';
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
    @ForeignUUIDColumn(() => User)
    declare userId: ForeignKey<string>;

    @ForeignUUIDColumn(() => Event)
    declare eventId: ForeignKey<string>;
}
