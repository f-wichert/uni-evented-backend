import { equalizable } from '../types';

export default function intersection<Type extends equalizable>(
    ArrayA: Type[],
    ArrayB: Type[],
): Type[] {
    return ArrayA.filter((elementOfA) =>
        ArrayB.some((elementOfB) => elementOfA.equals(elementOfB)),
    );
}
