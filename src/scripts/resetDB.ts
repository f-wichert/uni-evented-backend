import * as dotenv from 'dotenv';
dotenv.config();

import { sequelize, setupDatabase } from '../db';
import Event from '../db/models/event';
import Media from '../db/models/media';
import User from '../db/models/user';

export async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Successfully reset Database');

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
        hostId: user4.id,
        lat: 49.877432,
        lon: 8.654297,
    });

    const event2 = await Event.create({
        name: 'actually cool event',
        startDateTime: new Date(),
        hostId: user3.id,
        lat: 50.877432,
        lon: 9.654297,
    });

    // Default Media for testing
    const movie01 = await Media.create({
        id: 'abcd',
        type: 'video',
        fileAvailable: true,
        eventId: event.id,
        userId: user2.id,
    });

    await event.addAttendee(user2);
    await event2.addAttendee(user3);
    await event2.addAttendee(user4);
    await event2.addAttendee(user5);

    await user.update({ currentEventId: event.id });
    await user2.update({ currentEventId: event.id });

    // speed up script exit
    await sequelize.close();
}

// only run if module invoked directly
if (require.main === module) {
    void generateTestdata();
}
