import { Feature } from '@/types/store'

/** Available features in the application with their access requirements */
export const APP_FEATURES: Record<string, Feature> = {
  'group-expenses': {
    id: 'group-expenses',
    name: 'Group Expenses',
    requiredLevel: 'registered',
    isEnabled: false,
  },
  'cloud-sync': {
    id: 'cloud-sync',
    name: 'Cloud Sync',
    requiredLevel: 'registered',
    isEnabled: false,
  },
  'receipt-scanning': {
    id: 'receipt-scanning',
    name: 'Receipt Scanning',
    requiredLevel: 'premium',
    isEnabled: false,
  }
}