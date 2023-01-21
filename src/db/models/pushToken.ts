import {
    DataTypes,
    ForeignKey,
    InferAttributes,
    InferCreationAttributes,
    NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, Model, PrimaryKey, Table, Validate } from 'sequelize-typescript';

import Expo from 'expo-server-sdk';
import { ForeignUUIDColumn } from '../utils';
import User from './user';

function validateExpoPushToken(value: string) {
    if (!Expo.isExpoPushToken(value)) throw new Error('Not a valid Expo push token');
}

@Table
export default class PushToken extends Model<
    InferAttributes<PushToken>,
    InferCreationAttributes<PushToken>
> {
    @PrimaryKey
    @Validate({ isExpoToken: validateExpoPushToken })
    @Column(DataTypes.STRING)
    declare token: string;

    @ForeignUUIDColumn(() => User)
    declare userId: ForeignKey<string>;
    @BelongsTo(() => User)
    declare user?: NonAttribute<User>;
}
