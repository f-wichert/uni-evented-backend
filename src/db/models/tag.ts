import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from 'sequelize';

export class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
    declare id: CreationOptional<string>;
    declare tag: string;
}

export default function init(sequelize: Sequelize) {
    Tag.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tag: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Tag',
        }
    );
}
