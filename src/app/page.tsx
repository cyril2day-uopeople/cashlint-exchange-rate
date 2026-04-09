import styles from './page.module.css'

const workflowCards = [
  {
    title: 'Quick Convert',
    body: 'Convert an amount with a current mid-market rate and keep the conversion result explicit.',
  },
  {
    title: 'Bid / Ask',
    body: 'Estimate spread-adjusted bid and ask rates from the mid-market value using preset provider profiles.',
  },
  {
    title: 'Historical Rates',
    body: 'Fetch a date-range series and preserve the data as a clean rate series for downstream analysis.',
  },
  {
    title: 'Rate Analysis',
    body: 'Compute statistics, trend direction, and volatility from the series without mixing in UI concerns.',
  },
] as const

const layerCards = [
  {
    label: 'Domain Core',
    value: 'Pure workflows and shared-kernel types',
  },
  {
    label: 'DTOs',
    value: 'Serializable shapes at the server boundary',
  },
  {
    label: 'Infrastructure',
    value: 'Frankfurter client and anti-corruption layer',
  },
  {
    label: 'UI',
    value: 'React rendering and page composition',
  },
] as const

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.hero}>
          <p className={styles.kicker}>Cashlint Exchange Rate v3</p>
          <h1>Exchange rates as a domain, not a widget.</h1>
          <p className={styles.lede}>
            This workspace models currency conversion, spread estimation, historical data,
            and statistical analysis with a pure domain core, thin DTOs, and server-side
            composition.
          </p>

          <div className={styles.metrics}>
            <div>
              <span>Bounded contexts</span>
              <strong>2</strong>
            </div>
            <div>
              <span>Workflows</span>
              <strong>4</strong>
            </div>
            <div>
              <span>Tests passing</span>
              <strong>70</strong>
            </div>
            <div>
              <span>Visualization rule</span>
              <strong>D3 + React</strong>
            </div>
          </div>
        </div>

        <aside className={styles.panel}>
          <p className={styles.panelLabel}>Layering</p>
          <div className={styles.panelGrid}>
            {layerCards.map((card) => (
              <article key={card.label} className={styles.panelCard}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
        </aside>

        <section className={styles.workflows}>
          <div className={styles.sectionHeading}>
            <p className={styles.kicker}>Current Focus</p>
            <h2>Incremental, testable slices.</h2>
          </div>

          <div className={styles.cardGrid}>
            {workflowCards.map((card) => (
              <article key={card.title} className={styles.card}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
