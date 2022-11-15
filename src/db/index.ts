import { Sequelize } from 'sequelize';
import config from '../config';

// Initialize DB. Connection won't be established immediately,
// only when `connect()` (see below) is called.
export const sequelize = new Sequelize(config.DB_PATH);

// Initialize model definitions
import defineChatMessage, { ChatMessage } from './models/chatMessage';
import defineClip, { Clip } from './models/clip';
import defineEvent, { Event } from './models/event';
import defineReview, { Review } from './models/review';
import defineTag, { Tag } from './models/tag';
import defineUser, { User } from './models/user';
defineChatMessage(sequelize);
defineClip(sequelize);
defineEvent(sequelize);
defineReview(sequelize);
defineTag(sequelize);
defineUser(sequelize);

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
    console.log(`Successfully connected to ${config.DB_PATH}.`);
}

export async function setupDatabase(force = false) {
    await connect();
    // Synchronize whole model to DB
    await sequelize.sync({force});
    console.log('All models were synchronized successfully.');
}
