import { DataTypes } from 'sequelize';
import { AllowNull, Column, ForeignKey, ModelClassGetter } from 'sequelize-typescript';

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
    opts: { optional: boolean } = { optional: false }
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
