import React, { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  CloudSun, CloudRain, Thermometer, TrendingUp, AlertTriangle, CalendarDays, ArrowUpRight
} from 'lucide-react'
import { predictionsAPI } from '../api'
import { PageLoader, ErrorState } from '../components/UI'

export default function WeatherForecastPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState(7)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      // Fetch predictions directly
      const res = await predictionsAPI.getBeds({ days: range })
      const forecast = res.data.data.predictions?.forecast || []
      setData(forecast)
    } catch (err) {
      console.error(err)
      setError('Failed to load weather predictions.')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <PageLoader message="Analyzing meteorological impact on patient admissions..." />
  if (error) return <ErrorState message={error} onRetry={fetchData} />
  if (!data || data.length === 0) return <ErrorState message="No data available." onRetry={fetchData} />

  // Calculate some aggregate insights
  const baseline = Math.round(data.reduce((acc, d) => acc + (d.predicted_admissions || d.predicted_demand), 0) / data.length)
  const riskDays = data.filter(d => d.weather && ['Heatwave', 'Heavy Rain', 'Rain'].includes(d.weather.condition))
  const peakDay = [...data].sort((a,b) => (b.predicted_admissions||b.predicted_demand) - (a.predicted_admissions||a.predicted_demand))[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-amber-400" />
            Weather Impact Forecast
          </h2>
          <p className="page-subtitle">Projecting upcoming patient volume surges based on local meteorological conditions.</p>
        </div>
      </div>

      {/* Aggregate Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-1">Weather Risk Days</div>
          <div className="text-3xl font-display font-bold text-amber-400 flex items-center gap-2">
            {riskDays.length} / {range}
            {riskDays.length > 2 && <AlertTriangle className="w-5 h-5 text-amber-500" />}
          </div>
          <p className="text-xs text-slate-500 mt-2">Days with extreme heat or heavy rain expected</p>
        </div>
        <div className="card bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-1">Peak Patient Surge Date</div>
          <div className="text-3xl font-display font-bold text-sky-400 flex items-center gap-2">
            {peakDay.day} <span className="text-lg font-sans text-slate-500">{peakDay.date.slice(5)}</span>
          </div>
          <p className="text-xs text-sky-500/80 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {peakDay.predicted_admissions} expected admissions
          </p>
        </div>
        <div className="card bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-1">{range}-Day Admission Baseline</div>
          <div className="text-3xl font-display font-bold text-slate-200">
            ~{baseline} <span className="text-sm font-sans text-slate-500 font-normal">avg / day</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Calculated standard operating volume</p>
        </div>
      </div>

      {/* Dynamic Visual Timeline */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-violet-400" /> Next {range} Days Breakdown
        </h3>
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
          {[3, 7, 14].map(d => (
            <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${range === d ? 'bg-violet-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              {d} Days
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {data.map((day, ix) => {
          const w = day.weather;
          if (!w) return null; // Fallback if mock data lacks weather
          
          const isRisk = ['Heatwave', 'Heavy Rain', 'Rain'].includes(w.condition);
          const surge = (day.predicted_admissions || day.predicted_demand) - baseline;
          
          return (
            <div key={ix} className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
              isRisk ? 'bg-amber-500/5 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'bg-slate-900/50 border-slate-700/50'
            }`}>
              <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">{day.day}</div>
              <div className="text-[10px] text-slate-600 mb-3">{day.date.slice(5)}</div>
              
              {/* Icon */}
              <div className="mb-2">
                {w.condition.includes('Rain') ? <CloudRain className="w-8 h-8 text-blue-400" /> : 
                 w.condition.includes('Heat') ? <Thermometer className="w-8 h-8 text-red-500" /> : 
                 <CloudSun className="w-8 h-8 text-amber-400" />}
              </div>
              
              {/* Weather info */}
              <div className="font-bold text-slate-200 text-lg mb-1">{w.temp}°C</div>
              <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full mb-3 ${
                isRisk ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'
              }`}>
                {w.condition}
              </div>
              
              <div className="w-full h-px bg-slate-800 my-2" />
              
              {/* Patient info */}
              <div className="text-[10px] text-slate-500 mb-0.5">Expected Admissions</div>
              <div className={`text-xl font-bold ${surge > 0 ? 'text-sky-400' : 'text-slate-300'}`}>
                {day.predicted_admissions || day.predicted_demand}
              </div>
              {surge > 0 && (
                <div className="text-[9px] text-sky-500 bg-sky-500/10 px-1.5 py-0.5 mt-1 rounded">
                  +{surge} surge
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Correlation Graph */}
      <h3 className="font-semibold text-slate-200 flex items-center gap-2 mt-8 mb-4">
        <TrendingUp className="w-4 h-4 text-emerald-400" /> Patient Volume vs Precipitation Risk
      </h3>
      <div className="card h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{top:10,right:10,left:-20,bottom:0}}>
            <defs>
              <linearGradient id="weatherGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" tick={{fontSize:11}} />
            <YAxis yAxisId="left" tick={{fontSize:11}} />
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:11}} stroke="#64748b" domain={[0, 100]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                return (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs shadow-xl min-w-[170px]">
                    <div className="font-semibold text-white mb-2 pb-2 border-b border-slate-700/50">{d?.date || label}</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sky-400">
                        <span>Admissions:</span> 
                        <strong>{d?.predicted_admissions || d?.predicted_demand}</strong>
                      </div>
                      {d?.weather && (
                        <div className="flex items-center justify-between text-amber-400">
                          <span>Weather:</span>
                          <strong>{d.weather.temp}°C {d.weather.condition}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }}
            />
            {/* Weather Probability Bar */}
            <Bar yAxisId="right" dataKey="weather.rain_prob" fill="#3b82f6" fillOpacity={0.15} radius={[4,4,0,0]} name="Rain Probability %" />
            
            {/* Patient Admissions Area */}
            <Area yAxisId="left" type="monotone" dataKey="predicted_admissions" stroke="#0ea5e9" strokeWidth={2.5}
              fill="url(#weatherGrad)" dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 2, stroke: '#1e293b' }} name="Predicted Admissions" />
            {/* Fallback Area */}
            <Area yAxisId="left" type="monotone" dataKey="predicted_demand" stroke="#0ea5e9" strokeWidth={2.5}
              fill="url(#weatherGrad)" dot={{ fill: '#0ea5e9', r: 4 }} name="Predicted Demand" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
