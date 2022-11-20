import * as dotenv from 'dotenv';
dotenv.config();

import { setupDatabase } from '../db';
import { User } from '../db/models/user';
import { Clip } from '../db/models/clip';

async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase();
    console.log('Succesfully reset Database');

    // Write your Testdata here
    await User.create({ firstName: 'Lorenzo', lastName: 'Von Matterhorn' });
    await Clip.create({ id: 'b3b5c206-6fd7-426e-b6c0-8a64bd9a2342', length: 1 });
}

void generateTestdata();
