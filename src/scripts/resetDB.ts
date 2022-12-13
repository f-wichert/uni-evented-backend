import * as dotenv from 'dotenv';
dotenv.config();

import { setupDatabase } from '../db';
import Event from '../db/models/event';
import User from '../db/models/user';
import Media from '../db/models/media'

async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Successfully reset Database');

    // Write your Testdata here
    const user = await User.create({ username: 'Lorenzo', password: 'Verysecure' });
    const user2 = await User.create({ username: 'Notlorenzo', password: 'Verysecure' });
    const user3 = await User.create({ username: 'Reallorenzo', password: 'Verysecure' });
    const user4 = await User.create({ username: 'Alice', password: 'Verysecure' });
    const user5 = await User.create({ username: 'Bob', password: 'Verysecure' });

    
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
    const movie01 = await Media.create({id: 'abcd', type:'video', fileAvailable:true, eventId:event.id, userId:user2.id})


    user3.currentEventId = event.id;
    user2.currentEventId = event.id;
    await event.addAttendee(user2);
    await user.save();
    await user2.save();
}

void generateTestdata();
