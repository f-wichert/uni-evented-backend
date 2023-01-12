import * as dotenv from 'dotenv';
dotenv.config();

import * as e from 'envsafe';

// https://github.com/KATT/envsafe#basic-usage
export default e.envsafe({
    // general
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
    ENABLE_SECRET_ROUTES: e.bool({
        default: false,
    }),

    // secrets + keys
    JWT_SECRET: e.str({
        desc: 'Used for signing authentication tokens, should be a secure randomly generated value',
    }),
    SMTP_URL: e.url({
        desc: 'SMTP connection URL for nodemailer',
        docs: 'https://nodemailer.com/smtp/',
    }),

    // media
    MEDIA_ROOT: e.str({
        default: 'media',
        desc: 'The root of the directory where all user media will be stored',
    }),
    MEDIA_UPLOAD_ROOT: e.str({
        default: 'uploads',
        desc: 'The root of the directory where all user uploads will be stored temporarily while being processed',
    }),

    // clips
    FFMPEG_TIMEOUT: e.num({
        default: 240,
        desc: 'The timeout for all ffmpeg processes in seconds',
    }),
    FFMPEG_HLS_SEGMENT_DURATION: e.num({
        default: 5,
        desc: 'The duration of hls segments for all videos',
    }),
    UPLOAD_INPUT_NAME_FIELD: e.str({
        default: 'File',
        desc: 'The name of the form data field containing all uploaded files',
    }),

    // live
    NMS_HTTP_PORT: e.port({
        default: 3001,
        desc: 'The port NodeMediaServers http server listens on',
    }),
    NMS_HTTPS_PORT: e.port({
        default: 3002,
        desc: 'The port NodeMediaServers https server listens on',
    }),
    NMS_RTMP_PORT: e.port({
        default: 3003,
        desc: 'The port NodeMediaServers rtmp server listens on',
    }),

    FFMPEG_PATH: e.str({
        default: '/usr/local/bin/ffmpeg',
        desc: 'Path to a ffmpeg binary',
    }),
});
