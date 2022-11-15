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

export class ChatMessage extends Model<
    InferAttributes<ChatMessage>,
    InferCreationAttributes<ChatMessage>
> {
    declare id: CreationOptional<string>;
    declare eventId: ForeignKey<Event['id']>;
    declare senderId: ForeignKey<User['id']>;
    declare content: string;
}

export default function init(sequelize: Sequelize) {
    ChatMessage.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'ChatMessage',
        }
    );
}
