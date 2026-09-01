import { useEffect, useState, type ReactElement } from 'react'
import type { Streak } from '../../core/holidays'
import { useToast } from '../../ui/toast'
import { useCopy } from '../../ui/useCopy'
import { cardFileName } from './layout'
import { CARD_HEIGHT, CARD_WIDTH, renderShareCard, type ShareCardInput } from './renderCard'
import { APP_NAME, shareLines } from './shareText'
import './share.css'

export interface ShareActionsProps extends ShareCardInput {
  /** Called after an action completes (save clicked, share finished, text copied). */
  onDone?: () => void
}

type CardState =
  | { status: 'loading'; url: null; blob: null }
  | { status: 'ready'; url: string; blob: Blob }
  | { status: 'error'; url: null; blob: null }

const IDLE: CardState = { status: 'loading', url: null, blob: null }

/** Preview of the 連休カード PNG with save / share / copy actions and a selectable text version. */
export function ShareActions(props: ShareActionsProps): ReactElement {
  const { year, appUrl, theme, streak, onDone } = props
  const toast = useToast()
  const copy = useCopy()
  const [card, setCard] = useState<CardState>(IDLE)

  // Depend on the streak's primitive fields so a new-but-equal object does not re-render the PNG.
  const { start, end, length, name, boosted } = streak
  const ptoKey = streak.ptoDays.join(',')

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    setCard(IDLE)
    const s: Streak = { start, end, length, name, ptoDays: ptoKey ? ptoKey.split(',') : [], boosted }
    renderShareCard({ year, streak: s, appUrl, theme }).then(
      (blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setCard({ status: 'ready', url: objectUrl, blob })
      },
      () => {
        if (!cancelled) setCard({ status: 'error', url: null, blob: null })
      },
    )
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [year, appUrl, theme, start, end, length, name, boosted, ptoKey])

  const lines = shareLines({ year, streak, appUrl })
  const text = lines.join('\n')
  const fileName = cardFileName(year, streak)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleShare = async () => {
    const data: ShareData = { title: APP_NAME, text: `${lines[0]}\n${lines[1]}`, url: appUrl }
    if (card.status === 'ready') {
      try {
        const file = new File([card.blob], fileName, { type: 'image/png' })
        if (navigator.canShare?.({ ...data, files: [file] })) data.files = [file]
      } catch {
        /* share text only */
      }
    }
    try {
      await navigator.share(data)
      onDone?.()
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      toast.show('共有できませんでした。テキストのコピーをお使いください。')
    }
  }

  const handleCopy = async () => {
    if (await copy(text, 'テキストをコピーしました')) onDone?.()
  }

  return (
    <div className="share">
      <div className="share__frame" aria-busy={card.status === 'loading'}>
        {card.status === 'ready' && (
          <img
            className="share__preview"
            data-testid="share-preview"
            src={card.url}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            alt="連休カードのプレビュー"
            decoding="async"
          />
        )}
        {card.status === 'loading' && (
          <p className="share__status caption" role="status">
            カードを作成中…
          </p>
        )}
        {card.status === 'error' && (
          <p className="share__status share__status--error" role="alert">
            カードを作成できませんでした。テキストのコピーは使えます。
          </p>
        )}
      </div>

      <div className="row share__actions">
        {card.status === 'ready' ? (
          <a
            className="btn btn--primary"
            data-testid="share-save"
            href={card.url}
            download={fileName}
            onClick={() => {
              toast.show('画像のダウンロードを開始しました')
              onDone?.()
            }}
          >
            画像を保存
          </a>
        ) : (
          <button type="button" className="btn btn--primary" data-testid="share-save" disabled>
            {card.status === 'loading' && <span className="spinner" aria-hidden="true" />}
            {card.status === 'loading' ? '作成中…' : '画像を保存'}
          </button>
        )}
        {canShare && (
          <button type="button" className="btn btn--secondary" data-testid="share-share" onClick={handleShare}>
            共有
          </button>
        )}
        <button type="button" className="btn btn--secondary" data-testid="share-copy" onClick={handleCopy}>
          テキストをコピー
        </button>
      </div>

      <pre className="share__text" data-testid="share-text">
        {text}
      </pre>
    </div>
  )
}
