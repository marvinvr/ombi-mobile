import { Tab } from "src/models/tabs"

export const adminTabs = (): Tab[] => {
    return [
        {
          id: 'movies',
          label: 'Movies',
          icon: 'videocam-outline'
        },
        {
          id: 'tv',
          label: 'TV Shows',
          icon: 'tv-outline'
        },
        {
          id: 'requests',
          label: 'Requests',
          icon: 'git-pull-request-outline'
        },
        {
          id: 'config',
          label: 'Config',
          icon: 'cog-outline'
        }
      ]
}

export const userTabs = (): Tab[] => {
    return [
        {
          id: 'movies',
          label: 'Movies',
          icon: 'videocam-outline'
        },
        {
          id: 'tv',
          label: 'TV Shows',
          icon: 'tv-outline'
        },
        {
          id: 'config',
          label: 'Config',
          icon: 'cog-outline'
        }
      ]
}

export const signedOutTabs = (): Tab[] => {
    return [
        {
          id: 'config',
          label: 'Config',
          icon: 'cog-outline'
        }
      ]
}