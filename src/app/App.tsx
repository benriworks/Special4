import { ShareActions } from '../features/share'
import { ToolsPanel } from '../features/tools'
import { YearMap } from '../features/yearmap'
import { ToastProvider } from '../ui/toast'
import { Footer } from './Footer'
import { Header } from './Header'
import { UpdateToast } from './pwa/UpdateToast'
import { useAppState } from './state/useAppState'
import { useTheme } from './theme/useTheme'
import './app.css'

export default function App() {
  const { state, today, setYear, setPto, setMode, setSettings } = useAppState()
  const { theme, toggle } = useTheme()

  return (
    <ToastProvider>
      <Header year={state.year} onChangeYear={setYear} theme={theme} onToggleTheme={toggle} />
      <main id="main">
        <YearMap
          year={state.year}
          pto={state.pto}
          mode={state.mode}
          settings={state.settings}
          today={today}
          onChangePto={setPto}
          onChangeMode={setMode}
          onChangeYear={setYear}
          renderShare={(streak) => <ShareActions year={state.year} streak={streak} appUrl={window.location.href} theme={theme} />}
        />
        <div className="container section">
          <ToolsPanel settings={state.settings} onChangeSettings={setSettings} today={today} referenceDate={today} />
        </div>
      </main>
      <Footer />
      <UpdateToast />
    </ToastProvider>
  )
}
