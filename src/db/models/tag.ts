import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Column, Default, Length, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export default class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
    @PrimaryKey
    @Default(DataTypes.UUIDV4)
    @Column(DataTypes.UUID)
    declare id: CreationOptional<string>;

    // The displayed text inside the tag
    @Length({ max: 12 })
    @Column(DataTypes.STRING)
    declare label: string;

    @Column(DataTypes.STRING)
    declare color: string;
}
