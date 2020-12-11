export interface Content {
    id: string,
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

export interface Movie extends Content {
    id: string,
    title: string,
    description: string,
    posterUrl: string,
    request: {
        id: number,
        requested: boolean,
        approved: boolean,
        denied: boolean
    }
    available: boolean
}

export interface TvShow extends Content {
    id: string,
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
    available: boolean,
    partlyAvailable: boolean,
}