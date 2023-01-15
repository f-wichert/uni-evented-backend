import * as dotenv from 'dotenv';
dotenv.config();

import { sequelize, setupDatabase } from '../db';
import Event from '../db/models/event';
import Message from '../db/models/message';
import Tag from '../db/models/tag';
import User from '../db/models/user';

export async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Successfully reset Database');

    const [PartyTag, BoardgamesTag, SportTag, DrinkingTag, MusicTag, TechnoTag] = await Promise.all(
        [
            {
                label: 'Party',
                value: 'party',
                color: 'blue',
            },
            {
                label: 'Boardgames',
                value: 'boardgames',
                color: 'brown',
            },
            {
                label: 'Sport',
                value: 'sport',
                color: 'green',
            },
            {
                label: 'Drinking',
                value: 'drinking',
                color: 'orange',
            },
            {
                label: 'Music',
                value: 'music',
                color: 'violet',
            },
            {
                label: 'Techno',
                value: 'techno',
                color: 'red',
            },
        ].map((tag) => Tag.create(tag)),
    );

    const users = await Promise.all(
        [
            {
                username: 'Lorenzo',
                password: 'Verysecure',
                email: 'test1@evented.live',
            },
            {
                username: 'Notlorenzo',
                password: 'Verysecure',
                email: 'test2@evented.live',
            },
            {
                username: 'Reallorenzo',
                password: 'Verysecure',
                email: 'test3@evented.live',
            },
            {
                username: 'Alice',
                password: 'Verysecure',
                email: 'test4@evented.live',
            },
            {
                username: 'Bob',
                password: 'Verysecure',
                email: 'test5@evented.live',
            },
        ].map((user) => User.create(user)),
    );

    const events = await Promise.all(
        [
            {
                name: 'cool event',
                startDateTime: new Date(),
                hostId: users[0].id,
                lat: 49.877432,
                lon: 8.654297,
            },
            {
                name: 'actually cool event',
                startDateTime: new Date(),
                hostId: users[0].id,
                lat: 49.867432,
                lon: 8.644297,
            },
        ].map((event) => Event.create(event)),
    );

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

    // Not yet implemented
    await users[0].addFollower(users[1]);
    await users[2].addFollower(users[1]);
    await users[3].addFollower(users[1]);
    await users[0].addFollower(users[2]);

    const TechnoTag = await Tag.create({
        label: 'Techno',
        value: 'techno',
        color: 'red',
    });

    // Write your Testdata here
    const user = await User.create({
        username: 'Lorenzo',
        password: 'Verysecure',
        email: 'test1@evented.live',
    });
    const user2 = await User.create({
        username: 'Notlorenzo',
        password: 'Verysecure',
        email: 'test2@evented.live',
    });
    const user3 = await User.create({
        username: 'Reallorenzo',
        password: 'Verysecure',
        email: 'test3@evented.live',
    });
    const user4 = await User.create({
        username: 'Alice',
        password: 'Verysecure',
        email: 'test4@evented.live',
    });
    const user5 = await User.create({
        username: 'Bob',
        password: 'Verysecure',
        email: 'test5@evented.live',
    });

    const event = await Event.create({
        name: 'cool event',
        startDateTime: new Date(),
        hostId: user.id,
        lat: 49.877432,
        lon: 8.654297,
    });

    const event2 = await Event.create({
        name: 'actually cool event',
        startDateTime: new Date(),
        hostId: user.id,
        lat: 49.867432,
        lon: 8.644297,
    });

    const message1 = await Message.create({
        message: 'This is a message',
        sendTime: new Date(),
        messageCorrespondent: user.id,
        eventId: event.id,
    });

    await event.addAttendee(user2, { through: { status: 'attending' } });
    await event2.addAttendee(user, { through: { status: 'attending' } });
    await event2.addAttendee(user3, { through: { status: 'attending' } });
    await event2.addAttendee(user4, { through: { status: 'attending' } });
    await event2.addAttendee(user5, { through: { status: 'attending' } });

    // Add Tags to Events
    await event.addTag(PartyTag);
    await event.addTag(SportTag);
    await event2.addTag(BoardgamesTag);
    await event2.addTag(DrinkingTag);

    await user.update({ currentEventId: event.id });
    await user2.update({ currentEventId: event.id });
    await users[0].addFavouriteTag(SportTag);
    await users[1].addFavouriteTag(SportTag);
    await users[0].addFavouriteTag(DrinkingTag);

    // speed up script exit
    await sequelize.close();
    console.log('Successfully created new Data!');
}

// only run if module invoked directly
if (require.main === module) {
    void generateTestdata();
}
