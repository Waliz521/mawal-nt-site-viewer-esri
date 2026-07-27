import { useSiteBatch } from '../../contexts/SiteBatchContext';

export default function BatchToggle() {
  const { siteBatch, setSiteBatch, batches, batchCounts } = useSiteBatch();

  return (
    <div className="batch-toggle" role="tablist" aria-label="Site batch">
      {batches.map(({ id, label }) => {
        const count = batchCounts?.[id];
        const text = count != null ? `${label} (${count})` : label;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={siteBatch === id}
            className={siteBatch === id ? 'active' : ''}
            onClick={() => setSiteBatch(id)}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
