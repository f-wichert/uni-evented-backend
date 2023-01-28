import sharp from 'sharp';

const CLIP_QUALITIES: ClipQuality[] = [
    {
        width: 360,
        height: 640,
        vBitrate: 600,
        vBufsize: 1200,
        aBitrate: 32,
        aSamplerate: 44100,
        aChannels: 1,
    },
    {
        width: 480,
        height: 854,
        vBitrate: 600,
        vBufsize: 1200,
        aBitrate: 32,
        aSamplerate: 44100,
        aChannels: 1,
    },
    {
        width: 720,
        height: 1280,
        vBitrate: 1500,
        vBufsize: 3000,
        aBitrate: 64,
        aSamplerate: 44100,
        aChannels: 2,
    },
];

const IMAGE_QUALITIES: ImageQuality[] = [
    {
        name: 'high',
        width: 1080,
        height: 1920,
        resizeOptions: { fit: 'inside' },
    },
    {
        name: 'medium',
        width: 720,
        height: 1280,
        resizeOptions: { fit: 'inside' },
    },
    {
        name: 'low',
        width: 480,
        height: 854,
        resizeOptions: { fit: 'inside' },
    },
];

const AVATAR_QUALITIES: ImageQuality[] = [
    {
        name: 'high',
        width: 512,
        height: 512,
        resizeOptions: { fit: 'cover' },
    },
];

const QUALITIES = {
    video: CLIP_QUALITIES,
    image: IMAGE_QUALITIES,
    avatar: AVATAR_QUALITIES,
};

export default QUALITIES;

export interface ClipQuality {
    readonly width: number;
    readonly height: number;
    readonly vBitrate: number;
    readonly vBufsize: number;
    readonly aBitrate: number;
    readonly aSamplerate: number;
    readonly aChannels: number;
}

// simple inclusion checking with type safety, inspired by
// https://stackoverflow.com/a/56792762
const imageQualityNames = ['high', 'medium', 'low'] as const;
type ImageQualityName = typeof imageQualityNames[number];

export interface ImageQuality {
    readonly name: ImageQualityName;
    readonly width: number;
    readonly height: number;
    readonly resizeOptions: sharp.ResizeOptions;
}
