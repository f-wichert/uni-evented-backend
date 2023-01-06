import crypto from 'crypto';
import {
    BelongsToManyAddAssociationMixin,
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
    Op,
} from 'sequelize';
import {
    AllowNull,
    BeforeCreate,
    BeforeUpdate,
    BelongsTo,
    BelongsToMany,
    Column,
    Default,
    HasMany,
    IsAlphanumeric,
    IsEmail,
    Length,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';

import { hashPassword, verifyPassword } from '../../utils/crypto';
import { ForeignUUIDColumn } from '../utils';
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
    @Unique
    @AllowNull(false)
    @Column(DataTypes.CITEXT)
    declare username: string;

    @IsEmail
    @Unique
    @AllowNull(false)
    @Column(DataTypes.CITEXT)
    declare email: string;

    // Validators run before create/update hooks, which is what we want;
    // bcrypt is capped at 72 bytes
    // TODO: add some requirements like 1+ uppercase/lowercase/number chars
    @Length({ min: 8, max: 64 })
    @AllowNull(false)
    @Column(DataTypes.STRING)
    declare password: string;

    // note: this is essentially a plaintext password,
    // but it'll be fine for our purposes as it's randomly generated
    @Column(DataTypes.STRING)
    declare passwordResetToken?: string | null;

    @Length({ min: 1, max: 16 })
    @Column(DataTypes.STRING)
    declare displayName?: string | null;

    // can be null if user is not attending an event
    @ForeignUUIDColumn(() => Event, { optional: true })
    declare currentEventId?: ForeignKey<string> | null;

    @BelongsTo(() => Event)
    declare currentEvent?: NonAttribute<Event> | null;

    // relationships

    // connected through `EventAttendee` table
    @BelongsToMany(() => Event, () => EventAttendee)
    declare events?: NonAttribute<Event[]>;

    @HasMany(() => Event)
    declare hostedEvents?: NonAttribute<Event[]>;

    // @BelongsToMany(() => User, () => FollowTable)
    // declare leaders? : NonAttribute<User[]>;
    // declare addLeader: BelongsToManyAddAssociationMixin<User, string>

    @BelongsToMany(() => User, 'FollowerTable') //() => FollowTable)
    declare followers?: NonAttribute<User[]>;
    declare addFollower: BelongsToManyAddAssociationMixin<User, string>;

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

    static async getByEmailOrUsername(email: string, username: string): Promise<User | null> {
        return await User.findOne({ where: { [Op.or]: { email: email, username: username } } });
    }

    async verifyPassword(input: string): Promise<boolean> {
        let valid = await verifyPassword(input, this.password);

        // if the user has a reset token, try matching that as well
        if (this.passwordResetToken) {
            const inputBuffer = Buffer.from(input);
            const resetTokenBuffer = Buffer.from(this.passwordResetToken);
            valid ||=
                inputBuffer.length === resetTokenBuffer.length &&
                crypto.timingSafeEqual(inputBuffer, resetTokenBuffer);
        }

        return valid;
    }
}
