export type HourCategory = 'lab' | 'external' | 'summer' | 'event' // must also change enum constraint when modifying

export type APIMember = {
    email: string
    first_name: string
    full_name: string
    photo: string
    photo_small: string
}

export type APIClockLabRequest = {
    action: 'in' | 'out' | 'void'
    email: string
}

export type APIClockExternalSubmitRequest = {
    email: string
    message: string
    hours: number
}

export type APIClockExternalRespondRequest = {
    id: number
    action: 'approve' | 'deny'
    category: HourCategory
}
export type APIClockResponse = { success: false; error: string; log_id?: number } | { success: true; log_id: number }
