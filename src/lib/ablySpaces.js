'use client'

import Spaces from '@ably/spaces'
import { getAblyClient } from '@/lib/ably'

let spacesInstance = null

// Returns the singleton Spaces instance, creating it if needed.
export function getSpacesClient() {
  if (!spacesInstance) {
    spacesInstance = new Spaces(getAblyClient())
  }
  return spacesInstance
}
 
export function destroySpacesClient() {
  spacesInstance = null
}