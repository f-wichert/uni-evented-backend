import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
} from 'sequelize';
import {
    AllowNull,
    BelongsToMany,
    Column,
    Default,
    DefaultScope,
    Length,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { equalizable } from '../../types';
import Event from './event';
import EventTags from './eventTags';

@DefaultScope(() => ({
    attributes: { exclude: ['createdAt', 'updatedAt'] },
}))
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
    @AllowNull(false)
    @Column(DataTypes.STRING)
    declare label: string;

    // https://reactnative.dev/docs/colors
    @AllowNull(false)
    @Column(DataTypes.STRING)
    declare color: string;

    @Column(DataTypes.STRING)
    declare parent?: string | null;

    @BelongsToMany(() => Event, () => EventTags)
    declare eventsWithThisTag: NonAttribute<Event[]>;

    equals(other: Tag): boolean {
        return this.id === other.id;
    }
}
