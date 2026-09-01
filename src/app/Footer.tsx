export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner caption">
          <p>祝日は「国民の祝日に関する法律」に基づいて、この端末の中だけで計算しています。外部との通信はありません。</p>
          <p>春分の日・秋分の日は、官報で公示される前の年は天文計算による予定値です（「予定」と表示）。実際の予定は公式の情報でご確認ください。</p>
          <p>週休・休業日・有休の設定はこのブラウザーにだけ保存されます。URLを共有すると、同じ表示を再現できます。</p>
          <div className="footer__links">
            <a href="https://github.com/benriworks/Special4" target="_blank" rel="noreferrer">
              ソースコード（GitHub）
            </a>
            <span>デモアプリ · Special4</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
