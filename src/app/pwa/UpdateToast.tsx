import { useRegisterSW } from 'virtual:pwa-register/react'

/** Shown when a new version of the app has been downloaded by the service worker. */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('service worker registration failed', error)
    },
  })
  if (!needRefresh) return null
  return (
    <div className="update-toast" role="status" data-testid="update-toast">
      <span>新しいバージョンがあります。</span>
      <div className="row">
        <button type="button" className="btn btn--primary btn--sm" onClick={() => void updateServiceWorker(true)}>
          更新する
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setNeedRefresh(false)}>
          あとで
        </button>
      </div>
    </div>
  )
}
