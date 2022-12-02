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
    const user2 = await User.create({ username: 'notlorenzo', password: 'notverysecure' });
    const event = await Event.create({
        name: 'cool event',
        startDateTime: new Date(),
        hostId: user.id,
        lat: 49.877432,
        lon: 8.654297,
    });

    user.currentEventId = event.id;
    user2.currentEventId = event.id;
    await event.addAttendee(user2);

    await user.save();
    await user2.save();
    await event.save();
}

void generateTestdata();
