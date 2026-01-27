export const normalizeIds = (ids: any[] | undefined) =>
    (ids || [])
        .map((x) => Number(x))
        .filter((n) => !Number.isNaN(n));

export const parsePrice = (x: any) => {
    const n = parseFloat(String(x ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
};
