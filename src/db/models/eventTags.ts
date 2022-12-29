import { ForeignKey, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Model, Table } from 'sequelize-typescript';

import { ForeignUUIDColumn } from '../utils';
import Event from './event';
import Tag from './tag';
import User from './user';

// n.b. This table doesn't *have* to be declared explicitly,
// we could also just have sequelize automatically infer the association table
// by using `"EventAttendee"` instead of `() => EventAttendee`.
// This way however, it'll be easier to add additional attributes to the association
// in case they're needed.

// Tried this above. Could not read classWithForeignKey.name (Property of undefinded)

@Table({ timestamps: false })
export default class EventTags extends Model<
    InferAttributes<EventTags>,
    InferCreationAttributes<EventTags>
> {
    @ForeignUUIDColumn(() => Tag)
    declare tagId: ForeignKey<string>;

    @ForeignUUIDColumn(() => Event)
    declare eventId: ForeignKey<string>;
}
