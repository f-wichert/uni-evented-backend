import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from 'sequelize';

import { hashPassword, verifyPassword } from '../../utils';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<string>;
    declare userName: string;
    declare password: string;
    declare displayName: string | null;

    async verifyPassword(input: string): Promise<boolean> {
        return await verifyPassword(input, this.password);
    }
}

// TODO: min/max length for most of these fields
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
                // Validators run before create/update hooks, which is what we want;
                // bcrypt is capped at 72 bytes
                validate: {
                    len: [8, 64],
                },
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

    // Define hooks
    // NOTE: these don't apply to bulk creates/updates
    User.beforeCreate(async (user) => {
        user.password = await hashPassword(user.password);
    });
    User.beforeUpdate(async (user) => {
        if (user.changed('password')) {
            user.password = await hashPassword(user.password);
        }
    });
}
