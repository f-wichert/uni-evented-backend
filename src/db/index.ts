import { Sequelize } from 'sequelize';

const db_path = process.env.DB_PATH;

// Initialize DB. Connection won't be established immediately,
// only when `connect()` (see below) is called.
// TODO: check if env var is set
export const sequelize = new Sequelize(db_path!);

// Initialize model definitions
import defineUser, { User } from './models/user';
defineUser(sequelize);
import defineEvent, { Event } from './models/event';
defineEvent(sequelize);

// Set up associations
User.hasMany(Event, { foreignKey: 'hostId', as: 'events' });
// Event.belongsTo(User);  // not sure about this

async function connect() {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
}

export async function setupDatabase() {
    await connect();
    // Synchronize whole model to DB
    await sequelize.sync({ force: true });
    console.log('All models were synchronized successfully.');
}
