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
