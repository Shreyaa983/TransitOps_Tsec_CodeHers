import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
export const Route = createFileRoute("/_app/reports/fuel")({
  component: () => {
    const data = [
      { m: "Jun", eff: 8.2 }, { m: "Jul", eff: 8.4 }, { m: "Aug", eff: 8.1 },
      { m: "Sep", eff: 7.9 }, { m: "Oct", eff: 8.0 }, { m: "Nov", eff: 7.7 },
    ];
    return (
      <div className="brutal-card p-5">
        <h3 className="font-bold mb-3">Fuel efficiency (L / 100 km)</h3>
        <div className="h-72"><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="m" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line type="monotone" dataKey="eff" stroke="var(--warning)" strokeWidth={2.5} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
      </div>
    );
  },
});
