import { RequestAction, RequestActionType, RequestType } from "./requests";

export interface Content {
    id: number,
    title: string,
    description: string,
    posterUrl?: string,
    request: {
        id: number,
        requested: boolean,
        approved: boolean,
        denied: boolean
    }
    available: boolean
}

export interface Request extends Content {
    id: number,
    title: string,
    description: string,
    posterUrl?: string,
    request: {
        id: number,
        requested: boolean,
        approved: boolean,
        denied: boolean,
        date: Date,
        user: {
            alias: string,
            email: string,
            name: string
        },
    }
    available: boolean
    type: RequestType,
    rating: number
}

export interface Movie extends Content {
    id: number,
    title: string,
    description: string,
    posterUrl: string,
    request: {
        id: number,
        requested: boolean,
        approved: boolean,
        denied: boolean
    }
    releaseDate: string,
    available: boolean,
    rating: number
}

export interface TvShow extends Content {
    id: number,
    title: string,
    description: string,
    posterUrl?: string,
    request: {
        id: number,
        requested: boolean,
        approved: boolean,
        denied: boolean,
        type: {
            all: boolean,
            firstSeason: boolean,
            latestSeason: boolean,
        },
        seasons: number[],
    }
    network: string,
    status: string,
    aired: string,
    available: boolean,
    partlyAvailable: boolean,
    rating: number
}

export interface Tag {
    color: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger',
    text: string
}

export interface ContentClass {
    id: number,
    title: string,
    description: string,
    tags: Array<Tag>,
    available: boolean,
    requested?: boolean,
    requestId?: number,
    posterUrl: string,
    type: RequestType,
    buttons: ContentActionButton[],
    disable: () => void
}

export interface ContentActionButton {
    label: string,
    color: string,
    disabled: boolean,
    action: RequestAction
}