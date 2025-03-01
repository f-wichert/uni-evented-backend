import { Sequelize } from 'sequelize-typescript';
import config from '../config';

// https://github.com/sequelize/sequelize-typescript

// Initialize DB. Connection won't be established immediately,
// only when `connect()` (see below) is called.
export const sequelize = new Sequelize(config.DB_PATH, {
    // Load all files from `./models`
    models: [__dirname + '/models'],

    logging: config.DB_LOGGING ? (msg) => console.debug(msg) : false,
});

export async function connect() {
    await sequelize.authenticate();

    // enable CITEXT extension for postgres; sqlite already supports it out of the box
    if (sequelize.getDialect() === 'postgres') {
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;');
    }

    console.log(`Successfully connected to ${config.DB_PATH.replace(/:[^:/]+@/, ':*****@')}.`);
}

export async function setupDatabase(force = false) {
    await connect();

    // Synchronize whole model to DB
    await sequelize.sync({ force });

    console.log('All models were synchronized successfully.');
}
