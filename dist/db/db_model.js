"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
// Connect to db
const db_path = process.env.DB_PATH;
exports.sequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: db_path,
});
// Class definitions
class User extends sequelize_1.Model {
    static createNewUser(firstName, lastName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield User.create({
                firstName: firstName,
                lastName: lastName,
            });
            console.log(`User ${firstName} ${lastName} was saved to the database!`);
        });
    }
}
exports.User = User;
class Event extends sequelize_1.Model {
}
class Review extends sequelize_1.Model {
}
class Clip extends sequelize_1.Model {
}
class ChatMesage extends sequelize_1.Model {
}
class Tag extends sequelize_1.Model {
}
class EventTags extends sequelize_1.Model {
}
class EventUsers extends sequelize_1.Model {
}
// Fields created by Sequelize: createdAt/updatedAt
// User
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING,
    },
}, {
    sequelize: exports.sequelize,
    modelName: 'User'
});
// Event
Event.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    host_id: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: User,
            key: 'id',
        }
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    lat: {
        type: sequelize_1.DataTypes.DECIMAL(8, 6),
        allowNull: false,
    },
    lon: {
        type: sequelize_1.DataTypes.DECIMAL(9, 6),
        allowNull: false,
    }
}, {
    sequelize: exports.sequelize,
    modelName: 'Event'
});
// Review
// Clip
// ChatMessage
// Tag
// EventTages
// EventUsers
