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
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Clip } from './clip';
import { User } from './user';

@Table
export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    @AllowNull(false)
    @Column
    declare name: string;

    @AllowNull(false)
    @Column(DataTypes.DECIMAL(8, 6))
    declare lat: number;

    @AllowNull(false)
    @Column(DataTypes.DECIMAL(9, 6))
    declare lon: number;

    @AllowNull(false)
    @Default(DataTypes.NOW())
    @Column
    declare startDateTime: Date;

    // can be null -> open end
    @Column(DataTypes.DATE)
    declare endDateTime?: Date | null;

    @ForeignKeyDec(() => User)
    @Column(DataTypes.STRING)
    declare hostId: ForeignKey<User['id']>;

    @BelongsTo(() => User)
    declare host?: NonAttribute<User>;

    @HasMany(() => Clip)
    declare clips?: NonAttribute<Clip[]>;
}

export default Event;
