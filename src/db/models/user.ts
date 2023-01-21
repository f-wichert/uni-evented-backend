import crypto from 'crypto';
import {
    BelongsToManyAddAssociationMixin,
    CreationOptional,
    DataTypes,
    HasManyAddAssociationMixin,
    HasManyGetAssociationsMixin,
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

import { equalizable } from '../../types';
import { pick } from '../../utils';
import { hash, hashPassword, verifyPassword } from '../../utils/crypto';
import MediaProcessor from '../../utils/mediaProcessing';
import Event, { EventStatus, EventStatuses } from './event';
import EventAttendee, { EventAttendeeStatus } from './eventAttendee';
import FollowerTable from './FollowerTable';
import Message from './message';
import Tag from './tag';

@Table
export default class User
    extends Model<InferAttributes<User>, InferCreationAttributes<User>>
    implements equalizable
{
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

    @Length({ max: 32 })
    @AllowNull(false)
    @Default('')
    @Column(DataTypes.STRING)
    declare displayName?: string;

    @Column(DataTypes.STRING)
    declare avatarHash?: string | null;

    // relationships

    @HasMany(() => Message)
    declare messages?: NonAttribute<Event[]>;

    // connected through `EventAttendee` table
    @BelongsToMany(() => Event, () => EventAttendee)
    declare events?: NonAttribute<Event[]>;

    @HasMany(() => Event)
    declare hostedEvents?: NonAttribute<Event[]>;

    @BelongsToMany(() => User, () => FollowerTable, 'followeeId', 'followerId')
    declare followers?: NonAttribute<User[]>;
    declare addFollower: BelongsToManyAddAssociationMixin<User, string>;
    declare getFollowers: HasManyGetAssociationsMixin<User>;

    @BelongsToMany(() => Tag, 'TagsILikeTable', 'userId', 'tagId')
    declare tags: NonAttribute<Tag[]>;
    declare addTag: HasManyAddAssociationMixin<Tag, string>;
    declare getTags: HasManyGetAssociationsMixin<Tag>;
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

    formatForResponse(opts?: { isMe?: boolean }) {
        const extraFields = opts?.isMe ? (['email'] as const) : [];
        return pick(this, ['id', 'username', 'displayName', 'avatarHash', ...extraFields]);
    }

    // Wrapper functions to make Tag-function names more meaningfull
    async getFavouriteTags() {
        return await this.getTags();
    }

    async addFavouriteTag(NewFavouredTag: Tag) {
        await this.addTag(NewFavouredTag);
    }

    async addFavouriteTags(...args: Tag[]) {
        for (const tag of args) {
            await this.addTag(tag);
        }
    }

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

    async addFollowedEventId(eventId: string) {
        const event = await Event.findByPk(eventId);

        if (!event) {
            throw new Error(`No Event with id ${eventId}`);
        }

        await this.followEvent(event);
    }

    async followEvent(event: Event) {
        await event.addAttendee(this, { through: { status: 'attending' } });
    }

    async unfollowEvent(event: Event) {
        await event.removeAttendee(this);
    }

    async getFollowedEvents(statuses?: EventStatus[]) {
        return (await User.findByPk(this.id, {
            include: [
                {
                    model: Event,
                    as: 'events',
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    required: false,
                    where: {
                        status: {
                            [Op.or]: statuses ?? EventStatuses,
                        },
                    },
                    through: { where: { status: 'interested' } },
                },
            ],
        }))!.events!;
    }

    async getHostedEvents(statuses?: EventStatus[]) {
        return await Event.findAll({
            where: {
                status: {
                    [Op.or]: statuses ?? EventStatuses,
                },
                hostId: this.id,
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
        });
    }

    async follow(followee: User) {
        await followee.addFollower(this);
    }

    async rateEventId(eventId: string, rating: number, statuses?: EventAttendeeStatus[]) {
        const [affectedRows] = await EventAttendee.update(
            { rating: rating },
            {
                where: {
                    eventId: eventId,
                    userId: this.id,
                    status: { [Op.or]: statuses ?? ['attending', 'left'] },
                },
            },
        );

        if (affectedRows !== 1) {
            throw new Error(`No Event with id ${eventId}`);
        }
    }

    async rateEvent(event: Event, rating: number, statuses?: EventAttendeeStatus[]) {
        await this.rateEventId(event.id, rating, statuses);
    }

    async getRating() {
        const hostedEvents = await this.getHostedEvents();
        const ratings = (await Promise.all(hostedEvents.map((event) => event.getRating()))).filter(
            (rating) => rating !== null,
        ) as number[];

        return ratings.length ? ratings.reduce((a, c) => a + c) / ratings.length : null;
    }

    // FIXME: remove old avatar images (?)
    async handleAvatarUpdate(input: Buffer | null): Promise<string | null> {
        if (input === null) return null;

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

    public equals(other: User): boolean {
        return this.id === other.id;
    }

    // List of all the people the user follows
    async getFollowees(): Promise<User[]> {
        const followeeTableRows = await FollowerTable.findAll({
            where: {
                followerId: this.id,
            },
        });
        const followeeIDs = followeeTableRows.map((row) => row.followeeId);
        return await User.findAll({
            where: {
                id: {
                    [Op.in]: followeeIDs,
                },
            },
        });
    }
}
