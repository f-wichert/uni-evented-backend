import * as dotenv from 'dotenv';
import path from 'path';

export default function setup() {
    const envPath = path.resolve(__dirname, './.env.test');
    dotenv.config({ path: envPath });
}
