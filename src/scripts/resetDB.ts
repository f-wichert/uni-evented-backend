import * as dotenv from 'dotenv';
dotenv.config();

import { sequelize, setupDatabase } from '../db';
import Event from '../db/models/event';
import Tag from '../db/models/tag';
import User from '../db/models/user';

export async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Successfully reset Database');

    const [PartyTag, BoardgamesTag, SportTag, DrinkingTag, MusicTag, TechnoTag] = await Promise.all(
        [
            Tag.create({
                label: 'Party',
                value: 'party',
                color: 'blue',
            }),
            Tag.create({
                label: 'Boardgames',
                value: 'boardgames',
                color: 'brown',
            }),
            Tag.create({
                label: 'Sport',
                value: 'sport',
                color: 'green',
            }),
            Tag.create({
                label: 'Drinking',
                value: 'drinking',
                color: 'orange',
            }),
            Tag.create({
                label: 'Music',
                value: 'music',
                color: 'violet',
            }),
            Tag.create({
                label: 'Techno',
                value: 'techno',
                color: 'red',
            }),
        ],
    );

    const users = await Promise.all([
        User.create({
            username: 'Lorenzo',
            password: 'Verysecure',
            email: 'test1@evented.live',
        }),
        User.create({
            username: 'Notlorenzo',
            password: 'Verysecure',
            email: 'test2@evented.live',
        }),
        User.create({
            username: 'Reallorenzo',
            password: 'Verysecure',
            email: 'test3@evented.live',
        }),
        User.create({
            username: 'Alice',
            password: 'Verysecure',
            email: 'test4@evented.live',
        }),
        User.create({
            username: 'Bob',
            password: 'Verysecure',
            email: 'test5@evented.live',
        }),
    ]);

    const events = await Promise.all([
        Event.create({
            name: 'cool event',
            startDateTime: new Date(),
            hostId: users[0].id,
            lat: 49.877432,
            lon: 8.654297,
        }),
        Event.create({
            name: 'actually cool event',
            startDateTime: new Date(),
            hostId: users[0].id,
            lat: 49.867432,
            lon: 8.644297,
        }),
    ]);

    await Promise.all([
        users[1].setCurrentEvent(events[0]),
        users[0].setCurrentEvent(events[1]),
        users[2].setCurrentEvent(events[1]),
        users[3].setCurrentEvent(events[1]),
        users[4].setCurrentEvent(events[1]),
        events[0].addTag(PartyTag),
        events[0].addTag(SportTag),
        events[1].addTag(BoardgamesTag),
        events[1].addTag(DrinkingTag),
    ]);

    // speed up script exit
    await sequelize.close();
}

// only run if module invoked directly
if (require.main === module) {
    void generateTestdata();
}
