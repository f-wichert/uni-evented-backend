// see https://sequelize.org/docs/v6/other-topics/typescript/

// 'CreationOptional' is a special type that marks the field as optional
// when creating an instance of the model (such as using Model.create()).

import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    Sequelize,
    DataTypes,
} from 'sequelize';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<string>;
    declare firstName: string;
    declare lastName: string | null;
}

export default function init(sequelize: Sequelize) {
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
}
