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
    BeforeCreate,
    BeforeUpdate,
    BelongsTo,
    BelongsToMany,
    Column,
    Default,
    ForeignKey as ForeignKeyDec,
    HasMany,
    IsAlphanumeric,
    Length,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { hashPassword, verifyPassword } from '../../utils/crypto';
import Event from './event';
import EventAttendee from './eventAttendee';

@Table
export default class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    // `CITEXT` makes the column and queries case-insensitive,
    // so that uppercase/lowercase in username does not matter
    // (it's pg-specific, and gets translated to `TEXT COLLATE NOCASE` for sqlite)
    @Length({ min: 1, max: 16 })
    @IsAlphanumeric
    @AllowNull(false)
    @Column(DataTypes.CITEXT)
    declare username: string;

    // Validators run before create/update hooks, which is what we want;
    // bcrypt is capped at 72 bytes
    @Length({ min: 8, max: 64 })
    @AllowNull(false)
    @Column
    declare password: string;

    @Length({ min: 1, max: 16 })
    @Column(DataTypes.STRING)
    declare displayName?: string | null;

    // can be null if user is not attending an event
    @ForeignKeyDec(() => Event)
    @AllowNull(true)
    @Column(DataTypes.UUID)
    declare currentEventId?: ForeignKey<string> | null;

    @BelongsTo(() => Event)
    declare currentEvent?: NonAttribute<Event> | null;

    // relationships

    // connected through `EventAttendee` table
    @BelongsToMany(() => Event, () => EventAttendee)
    declare events?: NonAttribute<Event[]>;

    @HasMany(() => Event)
    declare hostedEvents?: NonAttribute<Event[]>;

    // hooks

    @BeforeCreate
    static async beforeCreateHook(user: User) {
        user.password = await hashPassword(user.password);
    }

    @BeforeUpdate
    static async beforeUpdateHook(user: User) {
        if (user.changed('password')) {
            user.password = await hashPassword(user.password);
        }
    }

    // other methods

    static async getByUserName(username: string): Promise<User | null> {
        return await User.findOne({ where: { username: username } });
    }

    async verifyPassword(input: string): Promise<boolean> {
        return await verifyPassword(input, this.password);
    }
}
