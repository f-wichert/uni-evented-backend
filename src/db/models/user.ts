// see https://sequelize.org/docs/v6/other-topics/typescript/

// 'CreationOptional' is a special type that marks the field as optional
// when creating an instance of the model (such as using Model.create()).

import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from 'sequelize';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<string>;
    declare userName: string;
    declare password: string;
    declare displayName: string | null;

    verifyPassword(input: string): boolean {
        // TODO
        return this.password === input;
    }
}

export default function init(sequelize: Sequelize) {
    User.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            userName: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            displayName: {
                type: DataTypes.STRING,
            },
        },
        {
            sequelize,
            modelName: 'User',
        }
    );
}
