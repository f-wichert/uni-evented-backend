import * as dotenv from 'dotenv';
dotenv.config();

import * as e from 'envsafe';

// https://github.com/KATT/envsafe#basic-usage
export default e.envsafe({
    PORT: e.port({
        default: 3000,
        desc: 'The port the backend listens on',
    }),
    DB_PATH: e.url({
        devDefault: 'sqlite://./data.db',
        desc: 'The database connection url, i.e. <dialect>://<url>',
        example: 'sqlite://:memory:, sqlite://./some/path/, postgres://user:pass@host:5432/dbname',
    }),
});
