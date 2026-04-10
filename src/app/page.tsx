import {
  BidAskPanel,
  QuickConvertPanel,
  RateAnalysisPanel,
} from './_components'

const overviewCards = [
  {
    title: 'Quick answer',
    body: 'See what one currency is worth in another at a glance.',
  },
  {
    title: 'Practical estimate',
    body: 'Compare the headline rate with a more cautious price.',
  },
  {
    title: 'Recent context',
    body: 'Review how the rate has moved over the last few weeks.',
  },
] as const

const sourceNote =
  'The rates on this page are served by Frankfurter. Frankfurter gathers daily exchange-rate data from central banks and other official sources, including the European Central Bank, and relays those published rates through its API.'

const workflowPanels = [
  {
    key: 'quick-convert',
    Component: QuickConvertPanel,
  },
  {
    key: 'bid-ask',
    Component: BidAskPanel,
  },
  {
    key: 'rate-analysis',
    Component: RateAnalysisPanel,
  },
] as const

export default function Home() {
  return (
    <main className="page">
      <section className="page__shell">
        <header className="page__hero">
          <p className="page__hero-kicker">Cashlint Exchange Rate</p>
          <h1 className="page__hero-title">Exchange rates without the guesswork.</h1>
          <p className="page__hero-copy">
            Check what a currency is worth, compare a more cautious price, or look back at recent
            movement in one clean place.
          </p>

          <ul className="page__hero-cards">
            {overviewCards.map((card) => (
              <li key={card.title} className="page__hero-card-item">
                <article className="page__hero-card">
                  <strong className="page__hero-card-title">{card.title}</strong>
                  <p className="page__hero-card-copy">{card.body}</p>
                </article>
              </li>
            ))}
          </ul>

          <p className="page__source-note">{sourceNote}</p>
        </header>

        <section className="page__workflow-section" aria-labelledby="workflows-heading">
          <div className="page__section-heading">
            <p className="page__section-kicker">What you can do</p>
            <h2 id="workflows-heading" className="page__section-title">
              Pick the view you need.
            </h2>
          </div>

          <ul className="page__workflow-list">
            {workflowPanels.map(({ key, Component }) => (
              <li key={key} className="page__workflow-item">
                <Component />
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  )
}
