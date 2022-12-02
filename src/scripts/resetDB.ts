import * as dotenv from 'dotenv';
dotenv.config();

import { setupDatabase } from '../db';
import Event from '../db/models/event';
import User from '../db/models/user';

async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Successfully reset Database');

    // Write your Testdata here
    const user = await User.create({ username: 'lorenzo', password: 'verysecure' });
    const user2 = await User.create({ username: 'notlorenzo', password: 'verysecure' });
    const user3 = await User.create({ username: 'reallorenzo', password: 'verysecure' });
    const user4 = await User.create({ username: 'alice', password: 'verysecure' });
    const user5 = await User.create({ username: 'bob', password: 'verysecure' });

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
        hostId: user3.id,
        lat: 50.877432,
        lon: 9.654297,
    });

    user.currentEventId = event.id;
    user2.currentEventId = event.id;
    await event.addAttendee(user2);
    await user.save();
    await user2.save();
}

void generateTestdata();
