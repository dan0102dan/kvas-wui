/**
 * Возвращает количество дней до указанной даты
 * @param expirationDate - The expiration date in the format 'YYYY-MM-DD'
 * @returns The number of days left until the expiration date
*/
export function getDaysLeft(expirationDate: string): number {
    const now = new Date().getTime()
    const exp = new Date(expirationDate).getTime()

    if (isNaN(exp)) return 0
    const diff = exp - now

    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0)
}