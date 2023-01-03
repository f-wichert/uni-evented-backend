import _ from 'lodash';

/** Essentially just `lodash.pick` but with more strict typing (no partials) */
export function pick<T extends object, U extends keyof T>(object: T, props: U[]): Pick<T, U> {
    return _.pick<T, U>(object, props);
}
