import {
    BelongsToManyAddAssociationMixin,
    BelongsToManyCountAssociationsMixin,
    BelongsToManyGetAssociationsMixin,
    BelongsToManyRemoveAssociationMixin,
    CreationOptional,
    DataTypes,
    ForeignKey,
    HasManyAddAssociationMixin,
    HasManyAddAssociationsMixin,
    HasManyGetAssociationsMixin,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
    Op,
} from 'sequelize';
import {
    AfterCreate,
    AfterDestroy,
    AllowNull,
    BelongsTo,
    BelongsToMany,
    Column,
    Default,
    DefaultScope,
    HasMany,
    Length,
    Max,
    Min,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Enum, ForeignUUIDColumn } from '../utils';
import EventAttendee from './eventAttendee';
import EventTags from './eventTags';
import Media from './media';
import Message from './message';
import Tag from './tag';
import User from './user';

export const EventStatuses = ['scheduled', 'active', 'completed'] as const;
export type EventStatus = typeof EventStatuses[number];

@DefaultScope(() => ({
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    // always include host object
    include: [
        { model: User, as: 'host' },
        {
            model: Tag,
            as: 'tags',
            through: { attributes: [] },
        },
    ],
}))
@Table
export default class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    @Length({ min: 2, max: 64 })
    @AllowNull(false)
    @Column
    declare name: string;

    @Enum(EventStatuses)
    @AllowNull(false)
    @Default('scheduled')
    @Column(DataTypes.STRING)
    declare status: CreationOptional<EventStatus>;

    @Min(-90)
    @Max(90)
    @AllowNull(false)
    @Column(DataTypes.DECIMAL(8, 6))
    declare lat: number;

    @Min(-180)
    @Max(180)
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

    @Default('No Address given')
    @Column(DataTypes.STRING)
    declare address: CreationOptional<string>; // TODO: CreationOptional for now, because it is nowhere implemented yet. Should later be made manditory

    @Length({ max: 1000 })
    @Default('No Description')
    @Column(DataTypes.STRING(1000))
    declare description: CreationOptional<string>;

    @Length({ max: 12 })
    @Column(DataTypes.STRING)
    declare musicStyle: CreationOptional<string>;

    // relationships

    // declare tags
    @BelongsToMany(() => Tag, () => EventTags)
    declare tags: NonAttribute<Tag[]>;
    declare addTag: HasManyAddAssociationMixin<Tag, string>;
    declare addTags: HasManyAddAssociationsMixin<Tag, string>;
    declare getTags: HasManyGetAssociationsMixin<Tag>;

    @ForeignUUIDColumn(() => User)
    declare hostId: ForeignKey<string>;

    @BelongsTo(() => User)
    declare host: NonAttribute<User>;

    // connected through `EventAttendee` table
    @BelongsToMany(() => User, () => EventAttendee)
    declare attendees?: NonAttribute<User[]>;
    declare addAttendee: BelongsToManyAddAssociationMixin<User, string>;
    declare removeAttendee: BelongsToManyRemoveAssociationMixin<User, string>;
    declare countAttendees: BelongsToManyCountAssociationsMixin;
    declare getAttendees: BelongsToManyGetAssociationsMixin<User>;
    // + getAttendees, removeAttendee, hasAttendee also exist, see docs

    @HasMany(() => Media, { onDelete: 'CASCADE' })
    declare media?: NonAttribute<Media[]>;
    declare getMedia: HasManyGetAssociationsMixin<Media>;
    declare countMedia: BelongsToManyCountAssociationsMixin;

    @HasMany(() => Message, { onDelete: 'CASCADE' })
    declare messages?: NonAttribute<Message[]>;
    declare getMessages: HasManyGetAssociationsMixin<Message>;

    // hooks

    @AfterCreate
    static async afterCreateHook(event: Event): Promise<void> {
        // automatically add host as attendee on creation
        await event.addAttendee(event.hostId, { through: { status: 'interested' } });
    }

    @AfterDestroy
    static async afterDestroyHook(event: Event) {
        await Promise.all([
            EventAttendee.destroy({ where: { eventId: event.id } }),
            Media.destroy({ where: { eventId: event.id }, hooks: true }),
            EventTags.destroy({ where: { eventId: event.id } }),
            Message.destroy({ where: { eventId: event.id } }),
        ]);
    }

    // methods

    async start() {
        await this.update({ status: 'active' });
    }

    async stop() {
        await Promise.all([
            EventAttendee.update(
                { status: 'left' },
                { where: { eventId: this.id, status: 'attending' } },
            ),
            EventAttendee.destroy({ where: { eventId: this.id, status: 'interested' } }),
            this.update({ status: 'completed' }),
        ]);
    }

    /**
     * @returns the average rating of the event as a number in [1..=5]
     * or null if there are no ratings
     */
    async getRating() {
        const eventAttendees = await EventAttendee.findAll({
            where: {
                eventId: this.id,
                rating: { [Op.not]: null },
            },
        });
        return eventAttendees.length
            ? eventAttendees.map((ea) => ea.rating! as number).reduce((a, c) => a + c) /
                  eventAttendees.length
            : null;
    }
}
