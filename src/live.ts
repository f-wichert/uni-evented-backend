import NodeMediaServer from 'node-media-server';
import config from './config';

/**
 * A ```NodeMediaServer``` that accepts RTMP streams at
 * ```rtmp://localhost:config.NPS_RTMP_PORT/live/STREAM_NAME```
 * and remuxes them to hls at
 * ```http://localhost:config.NPS_HTTP_PORT/live/STREAM_NAME/index.m3u8```
 *
 * inspired by https://github.com/illuspas/Node-Media-Server
 */
const nodeMediaServer = new NodeMediaServer({
    rtmp: {
        port: config.NMS_RTMP_PORT,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
    },
    http: {
        mediaroot: config.MEDIA_ROOT,
        port: config.NMS_HTTP_PORT,
        allow_origin: '*',
    },
    trans: {
        ffmpeg: config.FFMPEG_PATH,
        tasks: [
            {
                app: 'live',
                hls: true,
                hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
            },
        ],
    },
});

export default nodeMediaServer;
