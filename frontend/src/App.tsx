import { LoginSheet } from './components/LoginSheet'
import { useRoute } from './router'
import { GroupScreen } from './screens/GroupScreen'
import { GroupsScreen } from './screens/GroupsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StudyScreen } from './screens/StudyScreen'
import { useSyncState } from './syncStore'

function Route() {
  const [first, id, action, mode] = useRoute()

  if (first === 'settings') return <SettingsScreen />
  if (first === 'g' && id && action === 'study') return <StudyScreen key={`${id}-${mode}`} groupId={id} all={mode === 'all'} />
  if (first === 'g' && id) return <GroupScreen key={id} groupId={id} />
  return <GroupsScreen />
}

export default function App() {
  const { toast, loginOpen } = useSyncState()

  return (
    <div className="app">
      <Route />
      {loginOpen && <LoginSheet />}
      {toast && (
        <div className={`toast ${toast.kind}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}
