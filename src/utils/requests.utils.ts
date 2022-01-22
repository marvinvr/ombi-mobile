import { RequestType } from 'src/models/requests';
import { Request } from 'src/models/content';

export const getParam = (item: any, type: RequestType, fieldName: string): any => (
    type === RequestType.TV ?
        item.childRequests?.[0]?.[fieldName]
        : item?.[fieldName]
);

export const sort = (lists: [Request[], Request[]]): Request[] => (
    Array.prototype.concat(...lists)
        .sort((a, b) => b.request.date - a.request.date)
);
