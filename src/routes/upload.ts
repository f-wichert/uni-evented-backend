import { Router } from 'express';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import fs from 'fs';
import config from '../config';
import { Clip } from '../db/models/clip';
import { requireAuth } from '../passport';
import { asyncHandler } from '../utils';
import { ClipQuality, FfmpegJobQueue } from '../utils/ffmpeg';

const CLIP_QUALITIES = [
    new ClipQuality(480, 854, 600, 32, 44100, 1),
    new ClipQuality(720, 1280, 1500, 64, 44100, 2),
];

const router = Router();

const ffmpegJobQueue = new FfmpegJobQueue();

/**
 * Processes any input video file into multiple hls stream with multiple qualities,
 * defined in `CLIP_QUALITIES`.
 *
 * The streams consist of one h264 video and an aac audio stream with the specified
 * resolutions and bitrates.
 *
 * @param input input file path
 * @param tmp path for a temporary audio container, should be .mp3
 * @param output output directory path
 */
async function processClip(id: string, input: string, tmp: string, output: string) {
    // attempt to extract the length of the video
    const probe: FfprobeData = await new Promise((resolve, reject) =>
        ffmpeg.ffprobe(input, (err, data) => (data ? resolve(data) : reject(err)))
    );

    const length = probe.format.duration;

    // TODO: do some audio pre-processing, needed if input has no audio stream
    // await ffmpegPromise(
    //     ffmpeg(input, { timeout: config.FFMPEG_TIMEOUT })
    //         .input('anullsrc=channel_layout=stereo:sample_rate=44100')
    //         .inputFormat('lavfi')
    //         .addOptions(['-c:a aac', '-ar 44100', '-ac 2', length ? `-t ${length}` : '-shortest',])
    //         .output(tmp)
    // );

    // inspired by https://stackoverflow.com/a/71985380
    let fmpg = ffmpeg(input, { timeout: config.FFMPEG_TIMEOUT })
        .addOptions(
            new Array<string[]>(CLIP_QUALITIES.length).fill(['-map 0:v:0', '-map 0:a:0']).flat()
        )
        .addOptions(['-c:v libx264', '-crf 22', '-c:a aac']);

    let streamMapString = '';

    CLIP_QUALITIES.forEach((quality, index) => {
        fmpg = fmpg.addOptions([
            `-filter:v:${index} scale=w=${quality.width}:h=${quality.height}`,
            `-maxrate:v:${index} ${quality.vBitrate}k`,
            `-bufsize:v:${index} ${quality.vBufsize}k`,
            `-b:a:${index} ${quality.aBitrate}k`,
            `-ar:a:${index} ${quality.aSamplerate}`,
            `-ac:a:${index} ${quality.aChannels}`,
        ]);
        streamMapString += `v:${index},a:${index},name:${quality.height}p `;
    });

    fmpg = fmpg
        .addOption('-var_stream_map', streamMapString)
        .addOptions([
            length ? `-t ${length}` : '-shortest',
            '-f hls',
            `-hls_time ${config.CLIP_HLS_SEGMENT_DURATION}`,
            '-hls_list_size 0',
            `-master_pl_name index.m3u8`,
        ])
        .output(`${output}/index-%v.m3u8`);

    await ffmpegJobQueue.process(id, fmpg);
}

// endpoint accepts a request with a single file
// in a field named config.CLIP_UPLOAD_INPUT_NAME_FIELD
router.post(
    '/clip',
    requireAuth,
    asyncHandler(async (req, res) => {
        if (!req.files || !(Object.keys(req.files).length === 1)) {
            throw Error('No or too many files uploaded');
        }

        const file = req.files[config.CLIP_UPLOAD_INPUT_NAME_FIELD];

        if (Array.isArray(file)) {
            throw Error(`File is an Array`);
        }

        const user = req.user!;

        // TODO: get the currently attended event from the user

        const clip = await Clip.create({ uploaderId: user.id });

        const uploadPath = `${config.MEDIA_UPLOAD_ROOT}/${clip.id}`;
        const tmpPath = uploadPath + '.tmp.mp3';
        const clipPath = `${config.MEDIA_ROOT}/clips/${clip.id}`;

        try {
            await fs.promises.mkdir(clipPath, { recursive: true });
            await file.mv(uploadPath);
            await processClip(clip.id, uploadPath, tmpPath, clipPath);
        } catch (error) {
            const clipId = clip.id;
            clip.destroy()
                .then(() => console.log(`removed clip ${clipId}`))
                .catch((error) => console.error(`failed to remove ${clipId}: ${String(error)}`));
            throw error;
        } finally {
            [uploadPath].forEach(
                (path) =>
                    void fs.promises
                        .rm(path)
                        .then(() => console.log(`removed ${path}`))
                        .catch((error) =>
                            console.error(`failed to remove ${path}: ${String(error)}`)
                        )
            );
        }

        clip.file_available = true;
        clip.save()
            .then(() => console.log(`clip ${clip.id} now available`))
            .catch((error) => console.error(`failed to save clip ${clip.id}: ${String(error)}`));

        res.send('ok!');
    })
);

export default router;
