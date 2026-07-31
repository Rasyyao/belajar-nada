export const PAGE_SIZE = 6;

export function parsePage(value) {
    const page = Number.parseInt(Array.isArray(value) ? value[0] : value, 10);
    return Number.isInteger(page) && page > 0 ? page : 1;
}

export function pageCount(total, pageSize = PAGE_SIZE) {
    return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(page, total, pageSize = PAGE_SIZE) {
    return Math.min(Math.max(page, 1), pageCount(total, pageSize));
}
