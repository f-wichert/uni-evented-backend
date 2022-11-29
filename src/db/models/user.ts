import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
} from 'sequelize';
import {
    AllowNull,
    BeforeCreate,
    BeforeUpdate,
    Column,
    Default,
    HasMany,
    Length,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { hashPassword, verifyPassword } from '../../utils/crypto';
import { Event } from './event';

// TODO: min/max length for most of these fields
@Table
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    // TODO: require ASCII-only, no umlauts etc.
    // `CITEXT` is pg-specific, and gets translated to `TEXT COLLATE NOCASE` for sqlite
    @AllowNull(false)
    @Column(DataTypes.CITEXT)
    declare username: string;

    // Validators run before create/update hooks, which is what we want;
    // bcrypt is capped at 72 bytes
    @Length({ min: 8, max: 64 })
    @AllowNull(false)
    @Column
    declare password: string;

    @Column(DataTypes.STRING)
    declare displayName?: string | null;

    @HasMany(() => Event)
    declare events?: NonAttribute<Event[]>;

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

    static async getByUserName(username: string): Promise<User | null> {
        return await User.findOne({ where: { username: username } });
    }

    async verifyPassword(input: string): Promise<boolean> {
        return await verifyPassword(input, this.password);
    }
}

export default User;
