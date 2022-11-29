import * as dotenv from 'dotenv';
dotenv.config();

import { setupDatabase } from '../db';
import Event from '../db/models/event';
import Media from '../db/models/media';
import User from '../db/models/user';

async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Successfully reset Database');

    // Write your Testdata here
    const user = await User.create({ username: 'lorenzo', password: 'verysecure' });
    const event = await Event.create({
        name: 'cool event',
        startDateTime: new Date(),
        hostId: user.id,
        lat: 49.877432,
        lon: 8.654297,
    });

    await Media.create({
        type: 'video',
        length: 42,
        eventId: event.id,
        userId: user.id,
    });
}

void generateTestdata();
