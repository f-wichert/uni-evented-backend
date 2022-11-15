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
