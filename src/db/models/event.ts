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
    ForeignKey as ForeignKeyDec,
    HasMany,
    Length,
    Max,
    Min,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import EventAttendee from './eventAttendee';
import Media from './media';
import User from './user';

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

    // relationships

    // TODO: foreign keys should be required on creation
    @ForeignKeyDec(() => User)
    @Column(DataTypes.UUID)
    declare hostId: ForeignKey<User['id']>;

    @BelongsTo(() => User)
    declare host?: NonAttribute<User>;

    @BelongsToMany(() => User, () => EventAttendee)
    declare attendees?: NonAttribute<User[]>;
    declare addAttendee: HasManyAddAssociationMixin<User, string>;
    // + getAttendees, removeAttendee, hasAttendee, countAttendee also exist, see docs

    @HasMany(() => Media)
    declare clips?: NonAttribute<Media[]>;

    // hooks

    @AfterCreate
    static async afterCreateHook(event: Event) {
        // automatically add host as attendee on creation
        await event.addAttendee(event.hostId);
    }
}
