import { useState } from 'react';

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const formatoEje = {
  dia: (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
  semana: (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
  mes: (iso) => new Date(iso).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
};

// Rectángulo con esquinas redondeadas solo arriba (la barra "nace" del baseline).
function barPath(x, width, yTop, yBase, radius) {
  const r = Math.min(radius, width / 2, Math.max(yBase - yTop, 0));
  if (r <= 0) return `M${x},${yBase} L${x},${yTop} L${x + width},${yTop} L${x + width},${yBase} Z`;
  return `
    M${x},${yBase}
    L${x},${yTop + r}
    Q${x},${yTop} ${x + r},${yTop}
    L${x + width - r},${yTop}
    Q${x + width},${yTop} ${x + width},${yTop + r}
    L${x + width},${yBase}
    Z
  `;
}

export default function ChartVentas({ datos, agrupacion }) {
  const [hover, setHover] = useState(null);

  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const baseline = padding.top + plotH;

  const maxTotal = Math.max(1, ...datos.map((d) => Number(d.total)));
  const n = datos.length;
  const band = n ? plotW / n : plotW;
  const barWidth = Math.min(24, band * 0.6);
  const maxIndex = datos.reduce((best, d, i) => (Number(d.total) > Number(datos[best]?.total ?? -1) ? i : best), 0);

  if (n === 0) {
    return <p className="muted">No hay ventas en el período seleccionado.</p>;
  }

  return (
    <div className="chart-ventas">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Ventas por período" className="chart-svg">
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={baseline}
          y2={baseline}
          className="chart-baseline"
        />
        {datos.map((d, i) => {
          const total = Number(d.total);
          const barHeight = (total / maxTotal) * plotH;
          const x = padding.left + i * band + (band - barWidth) / 2;
          const yTop = baseline - barHeight;
          const isHover = hover === i;
          const isMax = i === maxIndex;

          return (
            <g
              key={d.periodo}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover((h) => (h === i ? null : h))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((h) => (h === i ? null : h))}
              tabIndex={0}
              className="chart-bar-group"
            >
              {/* hit target más ancho que la barra visible */}
              <rect x={padding.left + i * band} y={padding.top} width={band} height={plotH} fill="transparent" />
              <path
                d={barPath(x, barWidth, yTop, baseline, 4)}
                className={isHover ? 'chart-bar chart-bar-hover' : 'chart-bar'}
              />
              {isMax && (
                <text x={x + barWidth / 2} y={yTop - 6} textAnchor="middle" className="chart-value-label">
                  {formatoMoneda.format(total)}
                </text>
              )}
              <text
                x={padding.left + i * band + band / 2}
                y={height - 8}
                textAnchor="middle"
                className="chart-axis-label"
              >
                {formatoEje[agrupacion](d.periodo)}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && datos[hover] && (
        <div className="chart-tooltip">
          <strong>{formatoMoneda.format(Number(datos[hover].total))}</strong>
          <span className="muted"> · {formatoEje[agrupacion](datos[hover].periodo)}</span>
        </div>
      )}
    </div>
  );
}
