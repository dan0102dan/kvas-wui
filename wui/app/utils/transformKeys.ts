/**
 * Конвертирует объект с ключами в snake_case в camelCase
 * @param obj Объект для конвертации
 * @returns Объект с ключами в camelCase
 * @example
 * const obj = { some_key: 'value' }
 * const camelObj = snakeToCamel(obj)
 * console.log(camelObj) // { someKey: 'value' }
 */
export function snakeToCamel(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => snakeToCamel(v))
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc: any, key: string) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            acc[camelKey] = snakeToCamel(obj[key])
            return acc
        }, {})
    }
    return obj
}

/**
 * Конвертирует объект с ключами в camelCase в snake_case
 * @param obj Объект для конвертации
 * @returns Объект с ключами в snake_case
 * @example
 * const obj = { someKey: 'value' }
 * const snakeObj = camelToSnake(obj)
 * console.log(snakeObj) // { some_key: 'value' }
 */
export function camelToSnake(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => camelToSnake(v))
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc: any, key: string) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
            acc[snakeKey] = camelToSnake(obj[key])
            return acc
        }, {})
    }
    return obj
}
