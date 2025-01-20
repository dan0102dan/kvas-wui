export interface User {
    userId: number
    serviceCode: string
    email: string | null
    uniqueKey: string
    architecture: string
    model?: string
    kvasVersion?: string
    purchaseCount: number
    subscriptionType?: string[]
    activationDate: string
    expirationDate: string
    subscriptionIds?: number[]
    type?: 'freeTrial' | 'paid' | 'lifetime' | 'freeBase'
}

export interface Plan {
    planId: number
    name: string
    price: number
    billing_cycle: string
    features: string
    type: 'freeTrial' | 'paid' | 'lifetime' | 'freeBase'
}