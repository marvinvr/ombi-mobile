import { OverviewContentRequest } from 'src/models/content';

export const sort = (lists: [OverviewContentRequest[], OverviewContentRequest[]]): OverviewContentRequest[] => {
    const items = Array.prototype.concat([...lists[0], ...lists[1]])
                    .sort((a, b) => b.request.date > a.request.date ? 1 : -1);

    const openItems = items.filter(item =>!(item.request.approved || item.request.denied || item.request.available));
    const closedItems = items.filter(item => item.request.approved || item.request.denied || item.request.available);

    return [...openItems,...closedItems];
};
