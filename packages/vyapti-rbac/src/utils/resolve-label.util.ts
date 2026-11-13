function resolveLabel(args: { name: string; label?: string | null }): string {
    const label = args.label?.trim() ?? '';
    if (label.length === 0) {
        return args.name;
    }
    return label;
}

function blankToNull(value: string | null | undefined): string | null {
    const trimmed = value?.trim() ?? '';
    if (trimmed.length === 0) {
        return null;
    }
    return trimmed;
}

function optionalHint(
    hint: string | null | undefined,
): string | null | undefined {
    if (hint === undefined) {
        return undefined;
    }
    return blankToNull(hint);
}

export { blankToNull, optionalHint, resolveLabel };
