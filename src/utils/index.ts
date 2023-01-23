import _ from 'lodash';

/** Essentially just `lodash.pick` but with more strict typing (no partials) */
export function pick<T extends object, U extends keyof T>(object: T, props: U[]): Pick<T, U> {
    return _.pick<T, U>(object, props);
}

export function zip<T1, T2>(a: T1[], b: T2[]): [T1, T2][] {
    if (a.length !== b.length)
        throw new Error(
            `expected zip arrays to be of equal lengths, got ${a.length} and ${b.length}`,
        );

    return _.zip(a, b) as [T1, T2][];
}

export function asyncHandler<Args extends unknown[]>(
    handler: (...args: Args) => Promise<void>,
): (...args: Args) => void {
    return (...args) => {
        handler(...args).catch(console.error);
    };
}
