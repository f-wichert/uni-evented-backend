import * as dotenv from 'dotenv';
dotenv.config();

import { setupDatabase } from '../db';
import { User } from '../db/models/user';

async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Succesfully reset Database');

    // Write your Testdata here
    await User.create({ userName: 'lorenzo', password: 'verysecure' });
}

void generateTestdata();
