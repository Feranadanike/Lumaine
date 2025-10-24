import { useEffect, useRef } from 'react';

interface DataPoint {
  date: string;
  valueA: number;
  valueB: number;
}

interface CorrelationGraphProps {
  data: DataPoint[];
  activityA: string;
  activityB: string;
  correlation: number;
}

export default function CorrelationGraph({ data, activityA, activityB, correlation }: CorrelationGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    const maxA = Math.max(...data.map(d => d.valueA));
    const maxB = Math.max(...data.map(d => d.valueB));
    const minA = Math.min(...data.map(d => d.valueA));
    const minB = Math.min(...data.map(d => d.valueB));

    const scaleX = (width - 2 * padding) / (maxA - minA || 1);
    const scaleY = (height - 2 * padding) / (maxB - minB || 1);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i * (width - 2 * padding)) / 5;
      const y = padding + (i * (height - 2 * padding)) / 5;

      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.fillStyle = correlation > 0 ? '#10b981' : '#ef4444';
    data.forEach(point => {
      const x = padding + (point.valueA - minA) * scaleX;
      const y = height - padding - (point.valueB - minB) * scaleY;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    if (Math.abs(correlation) > 0.3) {
      const meanA = data.reduce((sum, d) => sum + d.valueA, 0) / data.length;
      const meanB = data.reduce((sum, d) => sum + d.valueB, 0) / data.length;

      const sumXY = data.reduce((sum, d) => sum + (d.valueA - meanA) * (d.valueB - meanB), 0);
      const sumXX = data.reduce((sum, d) => sum + Math.pow(d.valueA - meanA, 2), 0);

      const slope = sumXY / sumXX;
      const intercept = meanB - slope * meanA;

      const x1 = minA;
      const y1 = slope * x1 + intercept;
      const x2 = maxA;
      const y2 = slope * x2 + intercept;

      const screenX1 = padding + (x1 - minA) * scaleX;
      const screenY1 = height - padding - (y1 - minB) * scaleY;
      const screenX2 = padding + (x2 - minA) * scaleX;
      const screenY2 = height - padding - (y2 - minB) * scaleY;

      ctx.strokeStyle = correlation > 0 ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(screenX1, screenY1);
      ctx.lineTo(screenX2, screenY2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(activityA, width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(activityB, 0, 0);
    ctx.restore();

  }, [data, activityA, activityB, correlation]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
          {activityA} vs {activityB}
        </h3>
        <span className={`text-sm font-semibold ${
          correlation > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          r = {correlation.toFixed(2)}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="w-full"
      />
    </div>
  );
}
