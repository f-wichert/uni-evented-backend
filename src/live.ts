import NodeMediaServer from 'node-media-server';
import config from './config';
import Media from './db/models/media';
import { asyncHandler } from './utils';

/**
 * A `NodeMediaServer` that accepts RTMP streams at
 * ```x
 * rtmp://{ip}:{NMS_RTMP_PORT}/live/{name}?key={key}
 * ```
 *
 * and remuxes them to hls at
 *
 * ```x
 * http://{ip}:{NMS_HTTP_PORT}/live/{name}/index.m3u8
 * ```
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

declare type StreamArgs = {
    key: string | undefined;
};

function reject(id: string) {
    const session = nodeMediaServer.getSession(id);
    // session has a reject() method but for some reason the type `Map`
    (session as unknown as { reject(): void }).reject();
}

nodeMediaServer.on(
    'prePublish',
    asyncHandler(async (id, streamPath, args) => {
        const streamKey = (args as StreamArgs).key;

        if (!streamKey) reject(id);

        const streamId = streamPath.slice('/live/'.length);
        const [affectedRows] = await Media.update(
            { fileAvailable: true, streamKey: null },
            { where: { id: streamId, type: 'livestream', streamKey: streamKey } },
        );

        if (affectedRows !== 1) reject(id);
    }),
);

nodeMediaServer.on(
    'donePublish',
    asyncHandler(async (id, streamPath, args) => {
        const streamId = streamPath.slice('/live/'.length);
        await Media.update(
            { fileAvailable: false },
            { where: { id: streamId, type: 'livestream' } },
        );
    }),
);

export default nodeMediaServer;
