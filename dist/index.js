"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_setup_1 = require("./db/db_setup");
const db_model_1 = require("./db/db_model");
const dotenv = require('dotenv');
dotenv.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
app.get('/', (req, res) => {
    db_model_1.User.createNewUser('Jonas', 'Test');
    res.send('<h1> Initial setup </h1>');
});
app.listen(port, () => {
    (0, db_setup_1.setupDatabase)();
    console.log(`[server]: Server is running at https://localhost:${port}`);
});
