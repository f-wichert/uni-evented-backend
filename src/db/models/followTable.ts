import { ForeignKey, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Model, Table } from 'sequelize-typescript';

import { ForeignUUIDColumn } from '../utils';
import User from './user';

@Table({ timestamps: false })
export default class FollowTable extends Model<
    InferAttributes<FollowTable>,
    InferCreationAttributes<FollowTable>
> {
    @ForeignUUIDColumn(() => User)
    // The person that is followed
    declare leaderId: ForeignKey<string>;

    @ForeignUUIDColumn(() => User)
    declare followerId: ForeignKey<string>;
}
