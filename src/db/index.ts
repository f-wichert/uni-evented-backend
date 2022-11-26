import { Sequelize } from 'sequelize-typescript';
import config from '../config';

// Initialize DB. Connection won't be established immediately,
// only when `connect()` (see below) is called.
export const sequelize = new Sequelize(config.DB_PATH, { models: [__dirname + '/models'] });

export async function connect() {
    await sequelize.authenticate();
    console.log(`Successfully connected to ${config.DB_PATH}.`);
}

export async function setupDatabase(force = false) {
    await connect();
    // Synchronize whole model to DB
    await sequelize.sync({ force });
    console.log('All models were synchronized successfully.');
}
