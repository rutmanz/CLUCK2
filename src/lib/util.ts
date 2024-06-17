export function safeParseInt(value: any): number | undefined {
    if (typeof value === 'string') {
        const num = parseInt(value)
        return isNaN(num) ? undefined : num
    }
    if (typeof value === 'number') {
        return value
    }
}
