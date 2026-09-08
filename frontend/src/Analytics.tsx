import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { api } from './api'
export type AnalyticsData = {
  sent: number
  responses: number
  interviews: number
  offers: number
  response_rate: number
  interview_rate: number
  offer_rate: number
  average_response_days: number | null
  source: { name: string; value: number }[]
  role: { name: string; value: number }[]
  months: { name: string; value: number }[]
  pipeline: { name: string; value: number }[]
  funnel: { name: string; value: number }[]
  resume_performance: {
    id: string
    name: string
    applications: number
    responses: number
    interviews: number
    offers: number
  }[]
  methodology: string
}
const colors = ['#47765b', '#8b9f72', '#b6b692', '#d2b17c', '#73969a', '#b7c9b0']
export function Metric({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail: string
}) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}
export function Chart({
  data,
  type = 'bar',
}: {
  data: { name: string; value: number }[]
  type?: 'bar' | 'area'
}) {
  return (
    <div className="chart-frame">
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid vertical={false} stroke="#e6ebdf" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Area
                dataKey="value"
                name="Applications"
                stroke="#537d5d"
                fill="#dce8d3"
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ bottom: 12 }}>
              <CartesianGrid vertical={false} stroke="#e6ebdf" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar
                dataKey="value"
                name="Applications"
                fill="#6c8a60"
                radius={[5, 5, 0, 0]}
                maxBarSize={46}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">Your recorded activity will appear here.</div>
      )}
    </div>
  )
}
export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null),
    [error, setError] = useState('')
  useEffect(() => {
    api<AnalyticsData>('/analytics')
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])
  if (!data) return <p>{error || 'Reading your career activity…'}</p>
  return (
    <>
      <div className="metrics-grid">
        <Metric label="Applications sent" value={data.sent} detail="Recorded submissions" />
        <Metric
          label="Response rate"
          value={data.response_rate + '%'}
          detail={`${data.responses} recorded responses`}
        />
        <Metric
          label="Interview rate"
          value={data.interview_rate + '%'}
          detail={`${data.interviews} reached an interview`}
        />
        <Metric
          label="Offer rate"
          value={data.offer_rate + '%'}
          detail={`${data.offers} reached an offer`}
        />
      </div>
      <div className="analytics-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Momentum over time</h2>
            <span>APPLICATIONS / MONTH</span>
          </div>
          <Chart data={data.months} type="area" />
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Your opportunity funnel</h2>
            <span>STAGES REACHED</span>
          </div>
          <div className="funnel">
            {data.funnel.map((s, i) => (
              <div key={s.name}>
                <span>{s.name}</span>
                <div
                  style={{
                    width: `${Math.max(12, (100 * s.value) / Math.max(1, data.funnel[0].value))}%`,
                    background: colors[i],
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Where opportunities come from</h2>
            <span>BY SOURCE</span>
          </div>
          <Chart data={data.source} />
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Roles you’re exploring</h2>
            <span>BY ROLE</span>
          </div>
          <Chart data={data.role} />
        </section>
      </div>
      <section className="dashboard-panel">
        <div className="panel-heading">
          <h2>Resume outcomes</h2>
          <span>OBSERVED APPLICATION OUTCOMES</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Resume</th>
                <th>Applications</th>
                <th>Responses</th>
                <th>Interviews</th>
                <th>Offers</th>
              </tr>
            </thead>
            <tbody>
              {data.resume_performance.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.applications}</td>
                  <td>{r.responses}</td>
                  <td>{r.interviews}</td>
                  <td>{r.offers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="form-note">
          These are observed outcomes, not evidence that a particular resume caused a response.
        </p>
      </section>
      <p className="analytics-method">
        <strong>
          Average time to response:{' '}
          {data.average_response_days === null
            ? 'Not enough recorded dates'
            : data.average_response_days + ' days'}
          .
        </strong>{' '}
        {data.methodology}
      </p>
    </>
  )
}
