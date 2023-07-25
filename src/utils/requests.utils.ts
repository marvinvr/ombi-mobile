import { OverviewContentRequest } from 'src/models/content';

export const sort = (lists: [OverviewContentRequest[], OverviewContentRequest[]]): OverviewContentRequest[] => (
    Array.prototype.concat(...lists)
        .sort((a, b) => b.request.date - a.request.date)
);
