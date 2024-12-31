import { render } from '@testing-library/react'
import { DBProvider } from '@/contexts/db-context'

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <DBProvider>
      {ui}
    </DBProvider>
  )
} 