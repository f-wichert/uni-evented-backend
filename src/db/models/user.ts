import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs/promises';
import {
    BelongsToManyAddAssociationMixin,
    BelongsToManySetAssociationsMixin,
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
    Op,
} from 'sequelize';
import {
    AfterDestroy,
    AllowNull,
    BeforeCreate,
    BeforeUpdate,
    BelongsToMany,
    Column,
    Default,
    DefaultScope,
    HasMany,
    IsAlphanumeric,
    IsEmail,
    Length,
    Model,
    PrimaryKey,
    Scopes,
    Table,
    Unique,
} from 'sequelize-typescript';

import config from '../../config';
import { BelongsToManyGetAssociationsMixinFixed, equalizable } from '../../types';
import { pick } from '../../utils';
import { hash, hashPassword, verifyPassword } from '../../utils/crypto';
import MediaProcessor from '../../utils/mediaProcessing';
import Event, { EventStatus, EventStatuses } from './event';
import EventAttendee, { EventAttendeeStatus } from './eventAttendee';
import FollowerTable from './FollowerTable';
import Media from './media';
import Message from './message';
import PushToken from './pushToken';
import Tag from './tag';

export const publicUserFields = [
    'id',
    'username',
    'displayName',
    'avatarHash',
    'bio',
    'isAdmin',
] as const;

@DefaultScope(() => ({
    attributes: [...publicUserFields],
}))
@Scopes(() => ({
    full: {},
}))
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
    declare email?: string;

    // Validators run before create/update hooks, which is what we want;
    // bcrypt is capped at 72 bytes
    // TODO: add some requirements like 1+ uppercase/lowercase/number chars
    @Length({ min: 8, max: 64 })
    @AllowNull(false)
    @Column(DataTypes.STRING)
    declare password?: string;

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

    @Length({ max: 200 })
    @AllowNull(false)
    @Default('')
    @Column(DataTypes.STRING)
    declare bio?: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataTypes.BOOLEAN)
    declare isAdmin?: boolean;

    @Default(1)
    @AllowNull(false)
    @Column(DataTypes.NUMBER)
    declare DistanceWeight: CreationOptional<number>;

    @Default(1)
    @AllowNull(false)
    @Column(DataTypes.NUMBER)
    declare TagIntersectionWeight: CreationOptional<number>;

    @Default(1)
    @AllowNull(false)
    @Column(DataTypes.NUMBER)
    declare FolloweeIntersectionWeight: CreationOptional<number>;

    @Default(0.5)
    @AllowNull(false)
    @Column(DataTypes.NUMBER)
    declare AverageEventRatingWeight: CreationOptional<number>;

    @Default(0.3)
    @AllowNull(false)
    @Column(DataTypes.NUMBER)
    declare NumberOfMediasWeight: CreationOptional<number>;

    // relationships

    @HasMany(() => Message, { onDelete: 'CASCADE' })
    declare messages?: NonAttribute<Event[]>;

    // connected through `EventAttendee` table
    @BelongsToMany(() => Event, () => EventAttendee)
    declare events?: NonAttribute<Event[]>;
    declare getEvents: BelongsToManyGetAssociationsMixinFixed<Event>;

    @HasMany(() => Event, { onDelete: 'CASCADE' })
    declare hostedEvents?: NonAttribute<Event[]>;

    @BelongsToMany(() => User, () => FollowerTable, 'followeeId', 'followerId')
    declare followers?: NonAttribute<User[]>;
    declare addFollower: BelongsToManyAddAssociationMixin<User, string>;
    declare getFollowers: BelongsToManyGetAssociationsMixinFixed<User>;
    @BelongsToMany(() => User, () => FollowerTable, 'followerId', 'followeeId')
    declare followees?: NonAttribute<User[]>;
    declare getFollowees: BelongsToManyGetAssociationsMixinFixed<User>;

    @BelongsToMany(() => Tag, 'TagsILikeTable', 'userId', 'tagId')
    declare tags?: NonAttribute<Tag[]>;
    declare addTag: BelongsToManyAddAssociationMixin<Tag, string>;
    declare getTags: BelongsToManyGetAssociationsMixinFixed<Tag>;
    declare setTags: BelongsToManySetAssociationsMixin<Tag, string>;

    @HasMany(() => PushToken, { onDelete: 'CASCADE' })
    declare pushTokens?: NonAttribute<PushToken[]>;

    // hooks

    @BeforeCreate
    static async beforeCreateHook(user: User) {
        user.password = await hashPassword(user.password!);
    }

    @BeforeUpdate
    static async beforeUpdateHook(user: User) {
        if (user.changed('password')) {
            user.password = await hashPassword(user.password!);
        }
    }

    @AfterDestroy
    static async afterDestroyHook(user: User) {
        await Promise.all([
            Event.destroy({ where: { hostId: user.id }, hooks: true }),
            Media.destroy({ where: { userId: user.id }, hooks: true }),
            Message.destroy({ where: { senderId: user.id }, hooks: true }),
            EventAttendee.destroy({ where: { userId: user.id }, hooks: true }),
            FollowerTable.destroy({
                where: { [Op.or]: [{ followeeId: user.id }, { followerId: user.id }] },
                hooks: true,
            }),
        ]);
    }

    // other methods

    formatForResponse(opts?: { isMe?: boolean }) {
        const extraFields = opts?.isMe ? (['email'] as const) : [];
        return pick(this, [...publicUserFields, ...extraFields]);
    }

    // Wrapper functions to make Tag-function names more meaningfull
    async getFavouriteTags() {
        return await this.getTags();
    }

    async setFavouriteTags(newFavouriteTags: Tag[]) {
        await this.setTags(newFavouriteTags);
    }

    async addFavouriteTag(NewFavouredTag: Tag) {
        await this.addTag(NewFavouredTag);
    }

    async addFavouriteTags(...args: Tag[]) {
        for (const tag of args) {
            await this.addTag(tag);
        }
    }

    getRecommendationSettings() {
        return {
            DistanceWeigt: this.DistanceWeight,
            TagIntersectionWeight: this.TagIntersectionWeight,
            FolloweeIntersectionWeight: this.FolloweeIntersectionWeight,
            AverageEventRatingWeight: this.AverageEventRatingWeight,
            NumberOfMediasWeigth: this.NumberOfMediasWeight,
        };
    }

    static async getByEmailOrUsername(email: string, username: string): Promise<User | null> {
        return await User.scope('full').findOne({
            where: { [Op.or]: { email: email, username: username } },
        });
    }

    async verifyPassword(input: string): Promise<boolean> {
        assert(input), assert(this.password);
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
        return currentEventId ? await Event.findByPk(currentEventId) : null;
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
        await event.addAttendee(this, { through: { status: 'interested' } });
    }

    async unfollowEvent(event: Event) {
        await event.removeAttendee(this);
    }

    async getEventsWithAttendeeStatus(status: EventAttendeeStatus, eventStatuses?: EventStatus[]) {
        return await this.getEvents({
            where: {
                status: {
                    [Op.or]: eventStatuses ?? EventStatuses,
                },
            },
            through: { where: { status: status } },
        });
    }

    async getHostedEvents(statuses?: EventStatus[]) {
        return await Event.findAll({
            where: {
                status: {
                    [Op.or]: statuses ?? EventStatuses,
                },
                hostId: this.id,
            },
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
            throw new Error(`User is not an attending or no Event with id ${eventId}`);
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

    async handleAvatarUpdate(input: Buffer | null): Promise<string | null> {
        await fs.rm(`${config.MEDIA_ROOT}/avatar/${this.id}/${this.avatarHash}`, {
            recursive: true,
            force: true,
        });

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
}
