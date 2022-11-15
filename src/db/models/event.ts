import {
    CreationOptional,
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from 'sequelize';
import { User } from './user';

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
    declare id: CreationOptional<string>;
    declare hostId: ForeignKey<User['id']>;
    declare name: string;
    declare lat: number;
    declare lon: number;
    declare startDateTime: Date;
    declare endDateTime: Date;
}

export default function init(sequelize: Sequelize) {
    Event.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            lat: {
                type: DataTypes.DECIMAL(8, 6),
                allowNull: false,
            },
            lon: {
                type: DataTypes.DECIMAL(9, 6),
                allowNull: false,
            },
            startDateTime: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW(),
            },
            endDateTime: {
                type: DataTypes.DATE,
                // can be null -> open end
            },
        },
        {
            sequelize,
            modelName: 'Event',
        }
    );
}
