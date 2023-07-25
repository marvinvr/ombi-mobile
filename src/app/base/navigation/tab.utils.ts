import { Tab } from 'src/models/tabs';

export const adminTabs = (): Tab[] => [
        {
          id: 'search',
          label: 'Search',
          icon: 'search-outline'
        },
        {
          id: 'requests',
          label: 'Requests',
          icon: 'download-outline'
        },
        {
          id: 'config',
          label: 'Config',
          icon: 'cog-outline'
        }
      ];

export const userTabs = (): Tab[] => [
        {
          id: 'search',
          label: 'Search',
          icon: 'search-outline'
        },
        {
          id: 'config',
          label: 'Config',
          icon: 'cog-outline'
        }
      ];

export const signedOutTabs = (): Tab[] => [
        {
          id: 'config',
          label: 'Config',
          icon: 'cog-outline'
        }
      ];
