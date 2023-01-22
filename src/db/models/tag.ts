import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
} from 'sequelize';
import {
    BelongsToMany,
    Column,
    Default,
    Length,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { equalizable } from '../../types';
import Event from './event';
import EventTags from './eventTags';

@Table
export default class Tag
    extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>>
    implements equalizable
{
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    // The displayed text inside the tag
    @Length({ max: 14 })
    @Column(DataTypes.STRING)
    declare label: string;

    @Column(DataTypes.STRING)
    declare color: string;

    @Column(DataTypes.STRING)
    declare parent: CreationOptional<string>;

    @BelongsToMany(() => Event, () => EventTags)
    declare listOfEventsWithThisTag: NonAttribute<Event[]>;

    equals(other: Tag): boolean {
        return this.id === other.id;
    }
}
