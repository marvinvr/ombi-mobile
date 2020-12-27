export enum RequestType {
    MOVIE = 'movie',
    TV = 'tv',
    MUSIC = 'music'
}

export enum RequestActionType {
    MOVIE = 'Movie',
    TV = 'Tv',
    MUSIC = 'Music'
}

export enum RequestAction {
    APPROVE = 'approve',
    DENY = 'deny'
}

export enum RequestSort {
    REQUEST_DATE_ASC = 1,
    REQUEST_DATE_DESC = 2,
    TITLE_ASC = 3,
    TITLE_DESC = 4,
    STATUS_ASC = 5,
    STATUS_DESC = 6
}

export enum RequestStatus {
    NO_FILTER = 0,
    APPROVED = 3,
    PROCESSING_REQUEST = 4,
    PENDING_APPROVAL = 5
}

export enum RequestAvailability {
    NO_FILTER = 0,
    AVAILABLE = 1,
    NOT_AVAILABLE = 2
}