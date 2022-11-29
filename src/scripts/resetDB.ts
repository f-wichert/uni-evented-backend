import * as dotenv from 'dotenv';
dotenv.config();

import { setupDatabase } from '../db';
import { Clip } from '../db/models/clip';
import { Event } from '../db/models/event';
import { User } from '../db/models/user';

async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Succesfully reset Database');

    // Write your Testdata here
    const user = await User.create({ username: 'lorenzo', password: 'verysecure' });
    const event = await Event.create({
        name: 'h',
        startDateTime: new Date(),
        hostId: user.id,
        lat: 49.877432,
        lon: 8.654297,
    });
    await Clip.create({
        length: 42,
        eventId: event.id,
        uploaderId: user.id,
    });
}

void generateTestdata();
