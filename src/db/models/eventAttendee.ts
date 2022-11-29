import { DataTypes, ForeignKey, InferAttributes, InferCreationAttributes } from 'sequelize';
import { Column, ForeignKey as ForeignKeyDec, Model, Table } from 'sequelize-typescript';
import { Event } from './event';
import { User } from './user';

@Table({ timestamps: false })
export class EventAttendee extends Model<
    InferAttributes<EventAttendee>,
    InferCreationAttributes<EventAttendee>
> {
    @ForeignKeyDec(() => User)
    @Column(DataTypes.UUID)
    declare userId: ForeignKey<User['id']>;

    @ForeignKeyDec(() => Event)
    @Column(DataTypes.UUID)
    declare eventId: ForeignKey<Event['id']>;
}

export default EventAttendee;
