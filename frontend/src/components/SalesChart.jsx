import { useState } from 'react';

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const axisFormat = {
  day: (iso) => new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
  week: (iso) => new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
  month: (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
};

export default function SalesChart({ data, groupBy }) {
  const [hover, setHover] = useState(null);

  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const baseline = padding.top + plotH;

  const maxTotal = Math.max(1, ...data.map((d) => Number(d.total)));
  const n = data.length;
  const band = n ? plotW / n : plotW;
  const barWidth = Math.min(24, band * 0.6);
  const maxIndex = data.reduce((best, d, i) => (Number(d.total) > Number(data[best]?.total ?? -1) ? i : best), 0);

  if (n === 0) {
    return <p className="muted">No sales in the selected period.</p>;
  }

  return (
    <div className="sales-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sales by period" className="chart-svg">
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={baseline}
          y2={baseline}
          className="chart-baseline"
        />
        {data.map((d, i) => {
          const total = Number(d.total);
          const barHeight = (total / maxTotal) * plotH;
          const x = padding.left + i * band + (band - barWidth) / 2;
          const yTop = baseline - barHeight;
          const isHover = hover === i;
          const isMax = i === maxIndex;

          return (
            <g
              key={d.period}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover((h) => (h === i ? null : h))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((h) => (h === i ? null : h))}
              tabIndex={0}
              className="chart-bar-group"
            >
              {/* hit target wider than the visible bar */}
              <rect x={padding.left + i * band} y={padding.top} width={band} height={plotH} fill="transparent" />
              <rect
                x={x}
                y={yTop}
                width={barWidth}
                height={Math.max(baseline - yTop, 0)}
                className={isHover ? 'chart-bar chart-bar-hover' : 'chart-bar'}
              />
              {isMax && (
                <text x={x + barWidth / 2} y={yTop - 6} textAnchor="middle" className="chart-value-label">
                  {currencyFormat.format(total)}
                </text>
              )}
              <text
                x={padding.left + i * band + band / 2}
                y={height - 8}
                textAnchor="middle"
                className="chart-axis-label"
              >
                {axisFormat[groupBy](d.period)}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && data[hover] && (
        <div className="chart-tooltip">
          <strong>{currencyFormat.format(Number(data[hover].total))}</strong>
          <span className="muted"> · {axisFormat[groupBy](data[hover].period)}</span>
        </div>
      )}
    </div>
  );
}
