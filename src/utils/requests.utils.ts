import { OverviewContentRequest } from 'src/models/content';

export const sort = (lists: [OverviewContentRequest[], OverviewContentRequest[]]): OverviewContentRequest[] => (
    Array.prototype.concat(...lists)
        .sort((a, b) => b.request.date - a.request.date)
        .sort((a, b) => ((a.request.approved || a.request.denied || a.request.available)
                            && (b.request.approved || b.request.denied || b.request.available))
                            ? 0 : (a.request.approved || a.request.denied || a.request.available) ? 1 : -1)
);
