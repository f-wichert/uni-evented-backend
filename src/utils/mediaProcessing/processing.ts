import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import sharp from 'sharp';
import config from '../../config';
import { MediaType } from '../../db/models/media';
import {
    ClipQuality,
    FfmpegJob,
    ImageQuality,
    MediaProcessingQueue,
    SharpJob,
} from './definitions';

export default class MediaProcessor {
    private readonly videoQueue = new MediaProcessingQueue();
    private readonly imageQueue = new MediaProcessingQueue();

    async process(
        mediaType: MediaType,
        id: string,
        input: string,
        output: string,
        qualities: ClipQuality[] | ImageQuality[]
    ) {
        switch (mediaType) {
            case 'video':
                await this.processVideo(id, input, output, qualities as ClipQuality[]);
                break;
            case 'image':
                await this.processImage(id, input, output, qualities as ImageQuality[]);
                break;
        }
    }

    /**
     * Processes any input video file into multiple hls stream with multiple qualities,
     * defined in `CLIP_QUALITIES`.
     *
     * The streams consist of one h264 video and an aac audio stream with the specified
     * resolutions and bitrates.
     *
     * @param input input file path
     * @param output output directory path
     */
    async processVideo(id: string, input: string, output: string, qualities: ClipQuality[]) {
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
                new Array<string[]>(qualities.length).fill(['-map 0:v:0', '-map 0:a:0']).flat()
            )
            .addOptions(['-c:v libx264', '-crf 22', '-c:a aac']);

        let streamMapString = '';

        qualities.forEach((quality, index) => {
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
                `-hls_time ${config.FFMPEG_HLS_SEGMENT_DURATION}`,
                '-hls_list_size 0',
                `-master_pl_name index.m3u8`,
            ])
            .output(`${output}/index-%v.m3u8`);

        const job = new FfmpegJob(id, fmpg);
        await this.videoQueue.process(job);
    }

    async processImage(id: string, input: string, output: string, qualities: ImageQuality[]) {
        for (const quality of qualities) {
            const sharpObj = sharp(input)
                .resize(quality.width, quality.height, { fit: 'inside' })
                .jpeg({ mozjpeg: true });
            const job = new SharpJob(id, sharpObj, `${output}/${quality.name}.jpg`);
            await this.imageQueue.process(job);
        }
    }
}
