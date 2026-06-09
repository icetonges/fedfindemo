"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const palette = ["#2563eb", "#0f8a6a", "#b45309", "#6d28d9", "#c2410c", "#334155"];

export function BarPanel({ title, data, xKey = "name", yKey = "value" }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; yKey?: string }) {
  return (
    <div className="card chart-card">
      <h2 className="chart-title">{title}</h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce2ea" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={54} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey={yKey} radius={[5, 5, 0, 0]}>
            {data.map((_, index) => <Cell fill={palette[index % palette.length]} key={index} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaPanel({ title, data, xKey = "name", yKey = "value" }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; yKey?: string }) {
  return (
    <div className="card chart-card">
      <h2 className="chart-title">{title}</h2>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce2ea" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area type="monotone" dataKey={yKey} stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
