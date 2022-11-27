import CallableInstance from 'callable-instance';
import { FfmpegCommand } from 'fluent-ffmpeg';
import Queue from 'queue';

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
class FfmpegJob extends CallableInstance<[], void> {
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

    public run(): Promise<void> {
        return ffmpegPromise(this.command);
    }
}

/**
 * An asynchronous queue for ffmpeg commands.
 * Executing `FfmpegCommands` using `process` guarantees that only
 * one command is executed at a time in queue order.
 */
export class FfmpegJobQueue {
    private queue: Queue = new Queue({
        autostart: true,
        concurrency: 1,
    });

    /**
     * Adds the command to the execution queue and returns a promise that
     * resolves (or rejects) when the command execution has concluded
     *
     * @param id a unique id for the command
     * @param command the command to be executed
     * @returns a promise that resolves (or rejects) when the command execution has concluded
     */
    public process(id: string, command: FfmpegCommand): Promise<void> {
        const job = new FfmpegJob(id, command);
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
