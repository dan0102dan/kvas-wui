/**
 * Конвертирует объект с ключами в snake_case в camelCase
 * @param obj Объект для конвертации
 * @returns Объект с ключами в camelCase
 */
export function snakeToCamel(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => snakeToCamel(v))
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result: any, key: string) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase())
            result[camelKey] = snakeToCamel(obj[key])
            return result
        }, {})
    }
    return obj
}