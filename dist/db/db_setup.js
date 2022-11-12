"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = void 0;
const db_model_1 = require("./db_model");
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield db_model_1.sequelize.authenticate();
            console.log('Connection has been established successfully.');
        }
        catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    });
}
function setupDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield testConnection();
            // Synchronize whole model to DB
            yield db_model_1.sequelize.sync({ force: true });
            console.log("All models were synchronized successfully.");
        }
        catch (error) {
            console.error('Unable to match the data to the model:', error);
        }
    });
}
exports.setupDatabase = setupDatabase;
