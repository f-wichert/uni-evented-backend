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

    const PartyTag = await Tag.create({
        label: 'Party',
        value: 'party',
        color: 'blue',
    });

    const BoardgamesTag = await Tag.create({
        label: 'Boardgames',
        value: 'boardgames',
        color: 'brown',
    });

    const SportTag = await Tag.create({
        label: 'Sport',
        value: 'sport',
        color: 'green',
    });

    const DrinkingTag = await Tag.create({
        label: 'Drinking',
        value: 'drinking',
        color: 'orange',
    });

    const MusicTag = await Tag.create({
        label: 'Music',
        value: 'music',
        color: 'violet',
    });

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

    // Add Users to Events
    await event.addAttendee(user2);
    await event2.addAttendee(user);
    await event2.addAttendee(user3);
    await event2.addAttendee(user4);
    await event2.addAttendee(user5);

    // Add Tags to Events
    await event.addTag(PartyTag);

    await user.update({ currentEventId: event.id });
    await user2.update({ currentEventId: event.id });

    // speed up script exit
    await sequelize.close();
}

// only run if module invoked directly
if (require.main === module) {
    void generateTestdata();
}
