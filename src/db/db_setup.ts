import { sequelize } from './db_model';

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

export async function setupDatabase() {
    try {
        await testConnection();
        // Synchronize whole model to DB
        await sequelize.sync({ force: true });
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Unable to match the data to the model:', error);
    }
}
