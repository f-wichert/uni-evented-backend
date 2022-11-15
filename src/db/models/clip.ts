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
    // flag to tell whether the clip file is available (might not be if it is still being converted to m3u8)
    declare file_available: boolean;
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
            file_available: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            // length in seconds
            length: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
        },
        {
            sequelize,
            modelName: 'Clip',
        }
    );
}
