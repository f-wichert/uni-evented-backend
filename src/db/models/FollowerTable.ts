import { ForeignKey, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Model, Table } from 'sequelize-typescript';

import { ForeignUUIDColumn } from '../utils';
import User from './user';

// n.b. This table doesn't *have* to be declared explicitly,
// we could also just have sequelize automatically infer the association table
// by using `"EventAttendee"` instead of `() => EventAttendee`.
// This way however, it'll be easier to add additional attributes to the association
// in case they're needed.

// Tried this above. Could not read classWithForeignKey.name (Property of undefinded)

@Table({ timestamps: false })
export default class FollowerTable extends Model<
    InferAttributes<FollowerTable>,
    InferCreationAttributes<FollowerTable>
> {
    @ForeignUUIDColumn(() => User)
    declare followeeId: ForeignKey<string>;

    @ForeignUUIDColumn(() => User)
    declare followerId: ForeignKey<string>;
}
