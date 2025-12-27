"use client";

import { useEffect, useState } from "react";
import { GripVertical, Minus, RefreshCw, AlertCircle } from "lucide-react";

interface Widget {
  id: number;
  name: string;
  api: string;
  refresh: number;
  fields: string[];
  displayType: "card" | "table" | "chart";
  provider?: string;
  rateLimit?: { requests: number; period: string };
}

interface WidgetCardProps {
  widget: Widget;
  onDelete: () => void;
  theme: "light" | "dark";
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

export default function WidgetCard({
  widget,
  onDelete,
  theme,
  onDragStart,
  onDragOver,
  onDrop,
}: WidgetCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(widget.refresh);
  const [apiUsage, setApiUsage] = useState<{ count: number; limit: number }>({ count: 0, limit: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await fetch(widget.api);

      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
      
      // Update API usage tracking
      if (widget.provider && widget.rateLimit) {
        const storageKey = `finboard_api_usage`;
        const savedUsage = localStorage.getItem(storageKey);
        const usage = savedUsage ? JSON.parse(savedUsage) : {};
        
        const providerUsage = usage[widget.provider] || { count: 0, resetTime: Date.now() + (
          widget.rateLimit.period === "minute" ? 60000 :
          widget.rateLimit.period === "hour" ? 3600000 : 86400000
        )};
        
        // Reset if needed
        if (Date.now() >= providerUsage.resetTime) {
          providerUsage.count = 1;
          providerUsage.resetTime = Date.now() + (
            widget.rateLimit.period === "minute" ? 60000 :
            widget.rateLimit.period === "hour" ? 3600000 : 86400000
          );
        } else {
          providerUsage.count += 1;
        }
        
        usage[widget.provider] = providerUsage;
        localStorage.setItem(storageKey, JSON.stringify(usage));
        
        setApiUsage({
          count: Math.max(0, widget.rateLimit.requests - providerUsage.count),
          limit: widget.rateLimit.requests
        });
      }
    } catch (err: any) {
      console.error("Widget API Error:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCountdown(widget.refresh);
    
    const interval = setInterval(() => {
      fetchData();
      setCountdown(widget.refresh);
    }, widget.refresh * 1000);
    
    return () => clearInterval(interval);
  }, [widget.api, widget.refresh]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return widget.refresh;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [widget.refresh]);

  // Safely read nested paths including array access
  const getFieldValue = (obj: any, path: string) => {
    const parts = path.split(".");
    let result = obj;
    
    for (const part of parts) {
      if (result === null || result === undefined) return undefined;
      
      // Handle array access like "values.0.close"
      if (!isNaN(Number(part))) {
        const index = Number(part);
        if (Array.isArray(result)) {
          result = result[index];
        } else {
          return undefined;
        }
      } else {
        result = result[part];
      }
    }
    
    return result;
  };

  // Format value based on type
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") {
      return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
    }
    return String(value);
  };

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return "";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdate.toLocaleTimeString();
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`${
        theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden cursor-move`}
    >
      {/* Widget Header */}
      <div className={`${theme === "dark" ? "bg-gray-750" : "bg-gray-50"} px-4 py-3 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical
              size={18}
              className={`${theme === "dark" ? "text-gray-500" : "text-gray-400"} cursor-grab active:cursor-grabbing flex-shrink-0`}
            />
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-bold truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {widget.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <RefreshCw size={10} className={countdown <= 3 ? "animate-spin" : ""} />
                <span>Refreshes every {widget.refresh}s</span>
                <span>•</span>
                <span className={countdown <= 5 ? "text-emerald-400 font-semibold" : ""}>
                  {countdown}s
                </span>
                {apiUsage.limit > 0 && (
                  <>
                    <span>•</span>
                    <span className={
                      apiUsage.count / apiUsage.limit > 0.5 ? "text-emerald-400" :
                      apiUsage.count / apiUsage.limit > 0.2 ? "text-yellow-400" : "text-red-400"
                    }>
                      {apiUsage.count}/{apiUsage.limit} calls
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onDelete}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              theme === "dark"
                ? "hover:bg-red-900/30 text-red-400"
                : "hover:bg-red-50 text-red-500"
            }`}
            title="Remove Widget"
          >
            <Minus size={18} />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-4">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3"></div>
            <p className="text-gray-500 text-sm">Loading data...</p>
          </div>
        ) : error ? (
          <div className={`${theme === "dark" ? "bg-red-900/20 border-red-500/50" : "bg-red-50 border-red-200"} border rounded-lg p-4`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-500 font-medium text-sm">Failed to load data</p>
                <p className={`text-xs mt-1 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                  {error}
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="mt-3 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Try Again
            </button>
          </div>
        ) : data ? (
          <>
            {/* Card Display */}
            {widget.displayType === "card" && (
              <div className="space-y-3">
                {widget.fields.map((field, i) => {
                  const value = getFieldValue(data, field);
                  const fieldName = field.split(".").pop() || field;
                  
                  return (
                    <div
                      key={i}
                      className={`${
                        theme === "dark" ? "bg-gray-750" : "bg-gray-50"
                      } rounded-lg p-3 border ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-1`}>
                            {fieldName.toUpperCase()}
                          </p>
                          <p className={`text-sm font-mono truncate ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                            {field}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-lg font-bold ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                            {value !== undefined ? formatValue(value) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table Display */}
            {widget.displayType === "table" && (
              <div className="overflow-x-auto -mx-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${theme === "dark" ? "bg-gray-750" : "bg-gray-50"} border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                      <th className={`px-4 py-2 text-left font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Field
                      </th>
                      <th className={`px-4 py-2 text-right font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {widget.fields.map((field, i) => {
                      const value = getFieldValue(data, field);
                      return (
                        <tr
                          key={i}
                          className={`border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} ${
                            i % 2 === 0
                              ? theme === "dark"
                                ? "bg-gray-800"
                                : "bg-white"
                              : theme === "dark"
                              ? "bg-gray-750"
                              : "bg-gray-50"
                          }`}
                        >
                          <td className={`px-4 py-3 font-mono text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {field}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                            {value !== undefined ? formatValue(value) : "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Chart Display - Simple bar representation */}
            {widget.displayType === "chart" && (
              <div className="space-y-4">
                {widget.fields.map((field, i) => {
                  const value = getFieldValue(data, field);
                  const numValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
                  const maxValue = Math.max(
                    ...widget.fields.map(f => {
                      const v = getFieldValue(data, f);
                      return typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.-]/g, "")) || 0;
                    })
                  );
                  const percentage = isNaN(numValue) ? 0 : Math.abs((numValue / maxValue) * 100);
                  const fieldName = field.split(".").pop() || field;

                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {fieldName}
                        </span>
                        <span className={`text-sm font-bold ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                          {value !== undefined ? formatValue(value) : "N/A"}
                        </span>
                      </div>
                      <div className={`h-8 ${theme === "dark" ? "bg-gray-750" : "bg-gray-100"} rounded-lg overflow-hidden`}>
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 flex items-center justify-end px-2"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 20 && (
                            <span className="text-xs font-bold text-white">
                              {percentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}