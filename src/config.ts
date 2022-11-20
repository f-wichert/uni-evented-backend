import * as dotenv from 'dotenv';
dotenv.config();

import * as e from 'envsafe';

// https://github.com/KATT/envsafe#basic-usage
export default e.envsafe({
    NODE_ENV: e.str({
        choices: ['development', 'production'],
    }) as e.ValidatorSpec<'development' | 'production'>,
    PORT: e.port({
        default: 3000,
        desc: 'The port the backend listens on',
    }),
    DB_PATH: e.url({
        devDefault: 'sqlite://./data.db',
        desc: 'The database connection url, i.e. <dialect>://<url>',
        example: 'sqlite://:memory:, sqlite://./some/path/, postgres://user:pass@host:5432/dbname',
    }),
    JWT_SECRET: e.str(),
    MEDIA_ROOT: e.str({
        default: 'media',
        desc: 'The root of the directory where all user media will be stored',
    }),
    MEDIA_UPLOAD_ROOT: e.str({
        default: 'uploads',
        desc: 'The root of the directory where all user uploads will be stored temporarily while being processed',
    }),
    FFMPEG_TIMEOUT: e.num(),
    CLIP_MAX_RESOLUTION: e.str({
        default: '720x1280',
        desc: 'The resolution all clips will be converted to for the highest stream quality',
    }),
    CLIP_HLS_SEGMENT_DURATION: e.num(),
    CLIP_UPLOAD_INPUT_NAME_FIELD: e.str(),
});
