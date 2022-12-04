import CallableInstance from 'callable-instance';
import { FfmpegCommand } from 'fluent-ffmpeg';
import Queue from 'queue';
import { Sharp } from 'sharp';

export class ClipQuality {
    readonly width: number;
    readonly height: number;
    readonly vBitrate: number;
    readonly vBufsize: number;
    readonly aBitrate: number;
    readonly aSamplerate: number;
    readonly aChannels: number;

    constructor(
        width: number,
        height: number,
        vBitrate: number,
        aBitrate: number,
        aSamplerate: number,
        aChannels: number
    ) {
        this.width = width;
        this.height = height;
        this.vBitrate = vBitrate;
        this.vBufsize = 2 * vBitrate;
        this.aBitrate = aBitrate;
        this.aSamplerate = aSamplerate;
        this.aChannels = aChannels;
    }
}

// simple inclusion checking with type safety, inspired by
// https://stackoverflow.com/a/56792762
export const imageQualityNames = <const>['high', 'medium', 'low'];
export type ImageQualityName = typeof imageQualityNames[number];

export class ImageQuality {
    readonly name: ImageQualityName;
    readonly width: number;
    readonly height: number;

    constructor(name: ImageQualityName, width: number, height: number) {
        this.name = name;
        this.width = width;
        this.height = height;
    }
}

interface MediaProcessingJob {
    id: string;
    (): void;
}

interface MediaProcessingQueueOptions {
    concurrency?: number;
}

/**
 * An asynchronous queue for media processing job.
 * Executing `MediaProcessingJob`s using `process` guarantees that only
 * one job is executed at a time in queue order.
 */
export class MediaProcessingQueue {
    private readonly queue: Queue;

    constructor(options?: MediaProcessingQueueOptions) {
        this.queue = new Queue({
            autostart: true,
            concurrency: options ? options.concurrency || 1 : 1,
        });
    }

    /**
     * Adds the job to the execution queue and returns a promise that
     * resolves (or rejects) when job execution has concluded
     *
     * @param job the `MediaProcessingJob` to be added to the queue
     * @returns a promise that resolves (or rejects) when the command execution has concluded
     */
    process(job: MediaProcessingJob): Promise<void> {
        this.queue.push(job);
        return new Promise<void>((resolve, reject) => {
            const listener = (result: object | void, qjob: FfmpegJob) => {
                if (qjob.id == job.id) {
                    result instanceof Object ? reject(result) : resolve(result);
                    this.queue.removeListener('success', listener);
                    this.queue.removeListener('error', listener);
                }
            };
            this.queue.on('success', listener);
            this.queue.on('error', listener);
        });
    }
}

// inspired by https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/710#issuecomment-382917544
/**
 * Wraps a `FfmpegCommad` in a Promise and executes it
 * @param fmpg the command to be executed
 * @returns a Promise that resolves if the command execution was successful
 * and rejects of it wasn't
 */
function ffmpegPromise(fmpg: FfmpegCommand): Promise<void> {
    return new Promise((resolve, reject) => {
        fmpg.on('error', (error) => reject(error))
            .on('end', () => resolve())
            .run();
    });
}

/**
 * A callable wrapper for `FfmpegCommand` instances.
 * Calling the wrapper runs the command and returns
 * a Promise that resolves if the command execution was successful
 * and rejects if it wasn't
 */
export class FfmpegJob extends CallableInstance<[], void> implements MediaProcessingJob {
    readonly id: string;
    readonly command: FfmpegCommand;

    /**
     * @param id a unique id for the command
     * @param command the command to be wrapped and executed
     */
    constructor(id: string, command: FfmpegCommand) {
        super('run');
        this.id = id;
        this.command = command;
    }

    async run() {
        await ffmpegPromise(this.command);
    }
}

export class SharpJob extends CallableInstance<[], void> implements MediaProcessingJob {
    readonly id: string;
    readonly sharp: Sharp;
    readonly outputPath: string;

    constructor(id: string, sharp: Sharp, outputPath: string) {
        super('run');
        this.id = id;
        this.sharp = sharp;
        this.outputPath = outputPath;
    }

    async run() {
        await this.sharp.toFile(this.outputPath);
    }
}
