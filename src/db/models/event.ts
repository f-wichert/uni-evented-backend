import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    HasManyAddAssociationMixin,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
} from 'sequelize';
import {
    AfterCreate,
    AllowNull,
    BelongsTo,
    BelongsToMany,
    Column,
    Default,
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
import Media from './media';
import User from './user';

const EventStatuses = ['scheduled', 'active', 'completed'] as const;
type EventStatus = typeof EventStatuses[number];

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
    @Default('active')
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

    @Column({
        type: DataTypes.VIRTUAL,
        get() {
            return 5;
        },
        set(value) {
            console.log('ERROR! - The numberOfAttendees Value is read-only and can not be set!');
        },
    })
    declare numberOfAttendees: CreationOptional<number>;

    // relationships

    @ForeignUUIDColumn(() => User)
    declare hostId: ForeignKey<string>;

    @BelongsTo(() => User)
    declare host?: NonAttribute<User>;

    // connected through `EventAttendee` table
    @BelongsToMany(() => User, () => EventAttendee)
    declare attendees?: NonAttribute<User[]>;
    declare addAttendee: HasManyAddAssociationMixin<User, string>;
    // + getAttendees, removeAttendee, hasAttendee, countAttendee also exist, see docs

    @HasMany(() => User)
    declare currentAttendees?: NonAttribute<User[]>;

    @HasMany(() => Media)
    declare media?: NonAttribute<Media[]>;

    // hooks

    @AfterCreate
    static async afterCreateHook(event: Event) {
        // automatically add host as attendee on creation
        await event.addAttendee(event.hostId);
    }
}
