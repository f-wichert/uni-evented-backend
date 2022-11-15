import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from 'sequelize';
import { Event } from './event';
import { User } from './user';

export class Clip extends Model<InferAttributes<Clip>, InferCreationAttributes<Clip>> {
    declare id: CreationOptional<string>;
    declare eventId: ForeignKey<Event['id']>;
    declare uploaderId: ForeignKey<User['id']>;
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
        },
        {
            sequelize,
            modelName: 'Clip',
        }
    );
}
