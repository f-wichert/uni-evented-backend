import { Sequelize, Model, DataTypes } from 'sequelize';

// Connect to db
const db_path = process.env.DB_PATH;

// TODO: check if env var is set
export const sequelize = new Sequelize(db_path!);

// Class definitions
export class User extends Model {
    static async createNewUser(firstName: string, lastName: string) {
        await User.create({
            firstName: firstName,
            lastName: lastName,
        });
        console.log(`User ${firstName} ${lastName} was saved to the database!`);
    }
}
class Event extends Model {}
class Review extends Model {}
class Clip extends Model {}
class ChatMesage extends Model {}
class Tag extends Model {}
class EventTags extends Model {}
class EventUsers extends Model {}

// Fields created by Sequelize: createdAt/updatedAt

// User
User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
        },
    },
    {
        sequelize,
        modelName: 'User',
    }
);

// Event
Event.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        host_id: {
            type: DataTypes.UUID,
            references: {
                model: User,
                key: 'id',
            },
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
    },
    {
        sequelize,
        modelName: 'Event',
    }
);

// Review

// Clip

// ChatMessage

// Tag

// EventTages

// EventUsers
