export function generateUniqueId() {
    return Math.random().toString(36).slice(2, 9)
}