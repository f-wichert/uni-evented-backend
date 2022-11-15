import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    Sequelize,
    DataTypes,
    ForeignKey,
    IntegerDataType,
} from 'sequelize';
import { User } from './user';
import { Event } from './event';

export class Clip extends Model<InferAttributes<Clip>, InferCreationAttributes<Clip>> {
    declare id: CreationOptional<string>;
    declare eventId: ForeignKey<Event['id']>;
    declare uploaderId: ForeignKey<User['id']>;
    declare path: string;
    declare length: number;
}

export default function init(sequelize: Sequelize) {
    Clip.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            // length in seconds
            length: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            path: {
                type: DataTypes.STRING,
                defaultValue: "media/clips/clip_not_found.m3u8",
            }
        },
        {
            sequelize,
            modelName: 'Clip',
        }
    );
}
