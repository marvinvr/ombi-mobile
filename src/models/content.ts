import { RequestAction, RequestType } from './requests';

export interface OverviewContent {
    mediaType: 'movie' | 'tv';
    id: string;
    title: string;
    description: string;
    posterUrl?: string;
    rating?: number;
    requestedBy?: string;
    status?: RequestStatus;
}

export interface OverviewContentRequest extends OverviewContent {
    date: Date;
    request: RequestInfo;
    subtitle?: string;
    buttons?: ContentActionButton[];
}

export enum RequestStatus {
    OPEN = 'Open',
    APPROVED = 'Approved',
    DENIED = 'Denied',
    AVAILABLE = 'Available'
}

export interface RequestInfo {
    id: number;
    requested: boolean;
    available: boolean;
    approved: boolean;
    denied: boolean;
    date: Date;
    user: {
        alias: string;
        email: string;
        name: string;
    };
};

export interface Content {
    mediaType: 'movie' | 'tv';
    id: number;
    title: string;
    description: string;
    posterUrl?: string;
    request: {
        id: number;
        requested: boolean;
        approved: boolean;
        denied: boolean;
    };
    genres: string[];
    available: boolean;
    releaseDate?: Date;
}

export interface Request extends Content {
    mediaType: 'movie' | 'tv';
    id: number;
    title: string;
    description: string;
    posterUrl?: string;
    request: RequestInfo;
    available: boolean;
    type: RequestType;
    rating: number;
}

export interface Movie extends Content {
    mediaType: 'movie';
    id: number;
    title: string;
    description: string;
    posterUrl: string;
    request: {
        id: number;
        requested: boolean;
        approved: boolean;
        denied: boolean;
    };
    available: boolean;
    rating: number;
}

export interface TvShow extends Content {
    mediaType: 'tv';
    id: number;
    title: string;
    description: string;
    posterUrl?: string;
    request: {
        id: number;
        requested: boolean;
        approved: boolean;
        denied: boolean;
        type: {
            all: boolean;
            firstSeason: boolean;
            latestSeason: boolean;
        };
        seasons: number[];
    };
    network: string;
    status: string;
    aired: string;
    available: boolean;
    partlyAvailable: boolean;
    rating: number;
}

export interface Tag {
    color: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger';
    text: string;
}

export interface ContentClass {
    id: number;
    title: string;
    description: string;
    available: boolean;
    requested?: boolean;
    approved?: boolean;
    denied?: boolean;
    requestId?: number;
    posterUrl: string;
    type: RequestType;
    genres: string[];
    releaseYear: number;
    disable: () => void;
}

export interface ContentActionButton {
    label: string;
    color: 'primary' | 'success' | 'danger' | 'warning' | 'light';
    disabled: boolean;
    action: RequestAction;
}
