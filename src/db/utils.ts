import { DataTypes } from 'sequelize';
import { AllowNull, Column, ForeignKey, IsIn, ModelClassGetter } from 'sequelize-typescript';

/**
 * Shortcut for common foreign key decorators.
 * Equivalent to:
 *
 *   @ForeignKey(() => User)
 *   @AllowNull(false)
 *   @Column(DataTypes.UUID)
 *   declare ...;
 *
 * Instead, this can be used:
 *
 *   @ForeignUUIDColumn(() => User)
 *   declare ...;
 */

/* eslint-disable @typescript-eslint/ban-types */
export function ForeignUUIDColumn<TCreationAttributes extends {}, TModelAttributes extends {}>(
    relatedClassGetter: ModelClassGetter<TCreationAttributes, TModelAttributes>,
    opts: { optional: boolean } = { optional: false },
): Function {
    return (target: unknown, propertyName: string) => {
        [
            // decorators are applied in reverse
            ForeignKey(relatedClassGetter),
            AllowNull(opts.optional),
            Column(DataTypes.UUID),
        ]
            .reverse()
            .map((d) => {
                d(target, propertyName);
            });
    };
}
/* eslint-enable @typescript-eslint/ban-types */

/**
 * Similar to `DataTypes.ENUM`, but using local validation since (1) only postgres supports
 * enum types, and (2) a bug in sequelize currently prevents it from syncing enum types properly.
 * (see https://github.com/sequelize/sequelize/issues/7649)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Enum(values: readonly any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return IsIn([[...values]]);
}
