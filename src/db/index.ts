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
import defineClip, { Clip } from './models/clip';
defineClip(sequelize);
import defineReview, { Review } from './models/review';
defineReview(sequelize);
import defineTag, { Tag } from './models/tag';
defineTag(sequelize);
import defineChatMessage, { ChatMessage } from './models/chatMessage';
defineChatMessage(sequelize);

// Set up associations
User.hasMany(Event, { foreignKey: 'hostId', as: 'events' });
// Event.belongsTo(User);  // not sure about this
Event.hasMany(Clip, { foreignKey: 'eventId', as: 'clips' });
// Clip.belongsTo(Event);  // If I understood the docs, this should be alright
User.hasMany(Clip, { foreignKey: 'uploaderId', as: 'clips' });
// Clip.belongsTo(User);
Event.hasMany(Review, { foreignKey: 'reviewedEventId', as: 'reviews' });
// Review.belongsTo(Event);
User.hasMany(Review, { foreignKey: 'reviewerId', as: 'reviews' });
// Review.belongsTo(User);
Tag.belongsToMany(Event, { through: 'EventTags' }); // automatically creates a table to handle that association
Event.hasMany(ChatMessage, { foreignKey: 'eventId', as: 'chatmesssages' });
// ChatMessage.belongsTo(Event);
User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'chatmesssages' });
// ChatMessage.belongsTo(User);

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
