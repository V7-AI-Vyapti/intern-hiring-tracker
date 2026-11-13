let collectingModelFields = false;

export function setCollectingModelFields(value: boolean): void {
    collectingModelFields = value;
}

export function isCollectingModelFields(): boolean {
    return collectingModelFields;
}
