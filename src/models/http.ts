export interface Headers {
    [key: string]: string
}

export interface RequestParameters {
    [key: string]: string | boolean | number
}

export enum HttpRequestType {
    POST = 'post',
    GET = 'get',
    PUT = 'put',
    DELETE = 'delete'
}