import { RequestActionType } from "src/models/requests"
import { Tab } from "src/models/tabs"

export const adminTabs = (): Tab[] => {
    return [
        {
          id: RequestActionType.MOVIE,
          label: 'Movies',
          icon: 'videocam-outline'
        },
        {
          id: RequestActionType.TV,
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
          id: RequestActionType.MOVIE,
          label: 'Movies',
          icon: 'videocam-outline'
        },
        {
          id: RequestActionType.TV,
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