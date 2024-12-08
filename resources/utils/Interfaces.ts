// Interfaces.ts

// Artist interfaces
export interface SocialLinks {
  [key: string]: string
}

export interface Location {
  country: string
  city: string
}

export interface SearchHistoryEntry {
  timestamp: string
  type: 'artists' | 'albums' | 'singles'
  query: string
}
