import { sequelize } from './db_model';

async function testConnection() {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
}

export async function setupDatabase() {
    await testConnection();
    // Synchronize whole model to DB
    await sequelize.sync({ force: true });
    console.log('All models were synchronized successfully.');
}
