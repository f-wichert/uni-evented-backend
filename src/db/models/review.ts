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

export class Review extends Model<InferAttributes<Review>, InferCreationAttributes<Review>> {
    declare id: CreationOptional<string>;
    declare reviewedEventId: ForeignKey<Event['id']>;
    declare reviewerId: ForeignKey<User['id']>;
    declare review: number;
    declare comment: string;
}

export default function init(sequelize: Sequelize) {
    Review.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            review: {
                type: DataTypes.INTEGER,
                allowNull: false,
                // there's not really an easy way for a check constraint in Sequelize 🙃
            },
            comment: {
                type: DataTypes.TEXT,
            },
        },
        {
            sequelize,
            modelName: 'Review',
        }
    );
}
