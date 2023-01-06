import crypto from 'crypto';
import {
    BelongsToManyAddAssociationMixin,
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
    Op,
} from 'sequelize';
import {
    AllowNull,
    BeforeCreate,
    BeforeUpdate,
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

import { hash, hashPassword, verifyPassword } from '../../utils/crypto';
import MediaProcessor from '../../utils/mediaProcessing';
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

    @Column(DataTypes.STRING)
    declare avatarHash?: string | null;

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

    async getCurrentEventAttendee() {
        return await EventAttendee.findOne({
            where: { userId: this.id, status: 'attending' },
        });
    }

    async getCurrentEventId() {
        return (await this.getCurrentEventAttendee())?.eventId ?? null;
    }

    async getCurrentEvent() {
        const currentEventId = await this.getCurrentEventId();
        return currentEventId
            ? await Event.findByPk(currentEventId, {
                  attributes: { exclude: ['createdAt', 'updatedAt'] },
              })
            : null;
    }

    async setCurrentEventId(eventId: string | null) {
        const event = eventId ? await Event.findByPk(eventId) : null;

        if (eventId && !event) {
            throw new Error(`No Event with id ${eventId}`);
        }

        await this.setCurrentEvent(event);
    }

    async setCurrentEvent(event: Event | null) {
        await EventAttendee.update(
            { status: 'left' },
            { where: { userId: this.id, status: 'attending' } },
        );

        if (!event) return;

        await event.addAttendee(this, { through: { status: 'attending' } });
    }

    async getHostedEvents(statuses?: string[]) {
        return await Event.findAll({
            where: {
                status: {
                    [Op.or]: statuses ? statuses : [],
                },
                hostId: this.id,
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
        });
    }

    async getRating() {
        const hostedEvents = await this.getHostedEvents();
        const ratings = (await Promise.all(hostedEvents.map((event) => event.getRating()))).filter(
            (rating) => rating !== null,
        ) as number[];

        return ratings.length ? ratings.reduce((a, c) => a + c) / ratings.length : null;
    }

    // FIXME: remove old avatar images (?)
    async handleAvatarUpdate(input: Buffer): Promise<string> {
        const imageHash = hash(input, 'sha1');

        await MediaProcessor.handleUpload(
            'avatar',
            `${this.id}/${imageHash}`,
            async (outputDir) => {
                await MediaProcessor.processAvatar(imageHash, input, outputDir);
            },
        );

        return imageHash;
    }
}
