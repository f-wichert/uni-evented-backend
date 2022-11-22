import * as dotenv from 'dotenv';
dotenv.config();

import { setupDatabase } from '../db';
import { Clip } from '../db/models/clip';
import { User } from '../db/models/user';

async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Succesfully reset Database');

    // Write your Testdata here
    await User.create({ userName: 'lorenzo', password: 'verysecure' });
    await Clip.create({ id: 'b3b5c206-6fd7-426e-b6c0-8a64bd9a2342', length: 1 });
}

void generateTestdata();
