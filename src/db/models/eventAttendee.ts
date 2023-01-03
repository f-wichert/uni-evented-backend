import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
} from 'sequelize';
import { AllowNull, Column, DataType, Max, Min, Model, Table } from 'sequelize-typescript';

import { Enum, ForeignUUIDColumn } from '../utils';
import Event from './event';
import User from './user';

// n.b. This table doesn't *have* to be declared explicitly,
// we could also just have sequelize automatically infer the association table
// by using `"EventAttendee"` instead of `() => EventAttendee`.
// This way however, it'll be easier to add additional attributes to the association
// in case they're needed.

export const EventAttendeeStatuses = ['interested', 'attending', 'left', 'banned'] as const;
export type EventAttendeeStatus = typeof EventAttendeeStatuses[number];

export const EventAttendeeRatings = [1, 2, 3, 4, 5] as const;
export type EventAttendeeRating = typeof EventAttendeeRatings[number];

@Table({ timestamps: false })
export default class EventAttendee extends Model<
    InferAttributes<EventAttendee>,
    InferCreationAttributes<EventAttendee>
> {
    @ForeignUUIDColumn(() => User)
    declare userId: ForeignKey<string>;

    @ForeignUUIDColumn(() => Event)
    declare eventId: ForeignKey<string>;

    @Enum(EventAttendeeStatuses)
    @AllowNull(false)
    @Column(DataTypes.STRING)
    declare status: EventAttendeeStatus;

    // null if the user has not yet rated the event
    @Min(1)
    @Max(5)
    @AllowNull(true)
    @Column(DataType.SMALLINT)
    declare rating: CreationOptional<number | null>;
}
