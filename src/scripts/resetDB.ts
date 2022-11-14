import * as dotenv from 'dotenv';
dotenv.config();

import { setupDatabase } from '../db/db_setup';
import { User } from '../db/db_model';

// Wait for DB Setup bevore saving data
setupDatabase()
    .then(async () => {
        // Write your Testdata here
        await generateTestdata();
    })
    .then(() => {
        console.log('Succesfully reset Database');
    })
    .catch((error) => {
        // Handle Errors with creating testdata here
        console.log('Error while resetting Database!');
    });

// Write your Testdata here
async function generateTestdata() {
    await User.createNewUser('Lorenzo', 'Von Matterhorn');
}
