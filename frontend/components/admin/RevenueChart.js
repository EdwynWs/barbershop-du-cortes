'use client';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { money } from '../../services/api';

function formatDate(value) {
    const date = String(value).slice(0, 10);
    if (date.length === 7) {
        const months = [
            'jan',
            'fev',
            'mar',
            'abr',
            'mai',
            'jun',
            'jul',
            'ago',
            'set',
            'out',
            'nov',
            'dez',
        ];
        return months[Number(date.slice(5, 7)) - 1] || date;
    }
    return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

export default function RevenueChart({ data = [], x = 'dia', y = 'total', bars = false }) {
    const Chart = bars ? BarChart : AreaChart;
    return (
        <div className="revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
                <Chart data={data}>
                    <defs>
                        <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fb2035" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#fb2035" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#202a2c" vertical={false} />
                    <XAxis
                        dataKey={x}
                        stroke="#819092"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatDate}
                    />
                    <YAxis
                        width={47}
                        stroke="#819092"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
                    />
                    <Tooltip
                        labelFormatter={formatDate}
                        formatter={(value) => money(value)}
                        contentStyle={{
                            background: '#111b1d',
                            border: '1px solid #344447',
                            borderRadius: 8,
                            color: '#fff',
                        }}
                    />
                    {bars ? (
                        <Bar
                            isAnimationActive={false}
                            dataKey={y}
                            name="Faturamento"
                            fill="#fc2035"
                            radius={[3, 3, 0, 0]}
                            maxBarSize={24}
                        />
                    ) : (
                        <Area
                            isAnimationActive={false}
                            type="monotone"
                            dataKey={y}
                            name="Faturamento"
                            stroke="#ff2038"
                            strokeWidth={2.5}
                            fill="url(#revenue-fill)"
                            dot={{ fill: '#ff2038', r: 3, strokeWidth: 0 }}
                        />
                    )}
                </Chart>
            </ResponsiveContainer>
        </div>
    );
}
