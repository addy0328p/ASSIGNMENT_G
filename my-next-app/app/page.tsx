"use client";

import { useState, useEffect } from "react";
import WidgetCard from "./WidgetCard";
import { Plus, X, Download, Moon, Sun, Search } from "lucide-react";

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

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [widgetName, setWidgetName] = useState("");
  const [apiUrl, setApiUrl] = useState("https://api.coinbase.com/v2/exchange-rates?currency=BTC");
  const [refresh, setRefresh] = useState(30);
  const [useCustomApi, setUseCustomApi] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [sample, setSample] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [displayType, setDisplayType] = useState<"card" | "table" | "chart">("card");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<number | null>(null);
  const [showApiGuide, setShowApiGuide] = useState(false);
  
  // API usage tracking - MUST be declared before use
  const [apiUsage, setApiUsage] = useState<Record<string, { count: number; resetTime: number }>>({});

  // Load widgets, theme, and API usage from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("finboard_widgets");
    const savedTheme = localStorage.getItem("finboard_theme");
    const savedUsage = localStorage.getItem("finboard_api_usage");
    
    if (saved) setWidgets(JSON.parse(saved));
    if (savedTheme) setTheme(savedTheme as "light" | "dark");
    if (savedUsage) setApiUsage(JSON.parse(savedUsage));
  }, []);

  // Save widgets to LocalStorage
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem("finboard_widgets", JSON.stringify(widgets));
    }
  }, [widgets]);

  // Save API usage to LocalStorage
  useEffect(() => {
    localStorage.setItem("finboard_api_usage", JSON.stringify(apiUsage));
  }, [apiUsage]);

  // Track API usage
  const trackApiUsage = (provider: string, period: "minute" | "hour" | "day") => {
    const now = Date.now();
    const periodMs = period === "minute" ? 60000 : period === "hour" ? 3600000 : 86400000;
    
    setApiUsage(prev => {
      const current = prev[provider] || { count: 0, resetTime: now + periodMs };
      
      // Reset if period has passed
      if (now >= current.resetTime) {
        return {
          ...prev,
          [provider]: { count: 1, resetTime: now + periodMs }
        };
      }
      
      // Increment count
      return {
        ...prev,
        [provider]: { ...current, count: current.count + 1 }
      };
    });
  };

  // Get remaining API calls
  const getRemainingCalls = (provider: string, limit: number) => {
    const usage = apiUsage[provider];
    if (!usage) return limit;
    
    const now = Date.now();
    if (now >= usage.resetTime) return limit;
    
    return Math.max(0, limit - usage.count);
  };

  // Get time until reset
  const getResetTime = (provider: string) => {
    const usage = apiUsage[provider];
    if (!usage) return null;
    
    const now = Date.now();
    if (now >= usage.resetTime) return null;
    
    const diff = usage.resetTime - now;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Save theme to LocalStorage
  useEffect(() => {
    localStorage.setItem("finboard_theme", theme);
  }, [theme]);

  // Fetch sample API response
  const fetchSample = async () => {
    if (!apiUrl) {
      alert("Please enter an API URL");
      return;
    }

    // Find which provider is being used
    const selectedOption = apiOptions.find(opt => opt.url === apiUrl);
    if (selectedOption) {
      const remaining = getRemainingCalls(selectedOption.provider, selectedOption.rateLimit.requests);
      if (remaining <= 0) {
        const resetTime = getResetTime(selectedOption.provider);
        alert(`API rate limit reached. Resets in ${resetTime || "soon"}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("API request failed");
      const json = await res.json();
      setSample(json);
      setSelectedFields([]);
      
      // Track the API call
      if (selectedOption) {
        trackApiUsage(selectedOption.provider, selectedOption.rateLimit.period as any);
      }
    } catch (error) {
      alert("Failed to fetch API. Please check the URL and CORS settings.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Recursively extract all field paths from JSON including arrays
  const extractFields = (obj: any, prefix = ""): string[] => {
    let fields: string[] = [];
    
    if (Array.isArray(obj)) {
      // Handle arrays - show first element structure
      if (obj.length > 0) {
        fields = fields.concat(extractFields(obj[0], prefix + ".0"));
      }
    } else if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (Array.isArray(value)) {
          // For arrays, add array indicator and explore first element
          if (value.length > 0) {
            fields = fields.concat(extractFields(value[0], path + ".0"));
          } else {
            fields.push(path + "[]");
          }
        } else if (value && typeof value === "object") {
          fields = fields.concat(extractFields(value, path));
        } else {
          fields.push(path);
        }
      });
    }
    
    return fields;
  };

  const availableFields = sample ? extractFields(sample) : [];

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

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

  // Add Widget
  const addWidget = () => {
    if (!widgetName || !apiUrl) {
      alert("Please enter widget name and API URL");
      return;
    }

    if (selectedFields.length === 0) {
      alert("Please select at least one field to display");
      return;
    }

    // Find the selected API option to include rate limit info
    const selectedOption = apiOptions.find(opt => opt.url === apiUrl);

    const newWidget: Widget = {
      id: Date.now(),
      name: widgetName,
      api: apiUrl,
      refresh,
      fields: selectedFields,
      displayType,
      provider: selectedOption?.provider,
      rateLimit: selectedOption?.rateLimit
    };

    const updated = [...widgets, newWidget];
    setWidgets(updated);

    // Reset form
    setShowModal(false);
    setWidgetName("");
    setApiUrl(apiOptions[0].url);
    setRefresh(30);
    setSelectedFields([]);
    setSample(null);
    setDisplayType("card");
    setUseCustomApi(false);
  };

  // Delete Widget
  const deleteWidget = (id: number) => {
    const updated = widgets.filter((w) => w.id !== id);
    setWidgets(updated);
    localStorage.setItem("finboard_widgets", JSON.stringify(updated));
  };

  // Export configuration
  const exportConfig = () => {
    const config = { widgets, theme };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finboard-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Predefined API options with rate limits
  const apiOptions = [
    { 
      name: "Bitcoin Price (Coinbase)", 
      url: "https://api.coinbase.com/v2/exchange-rates?currency=BTC",
      provider: "coinbase",
      rateLimit: { requests: 10000, period: "hour" },
      guide: {
        title: "Coinbase Exchange Rates API",
        description: "Get real-time cryptocurrency exchange rates",
        parameters: [
          { name: "currency", description: "Base currency code (BTC, ETH, etc.)", example: "BTC" }
        ],
        exampleUrl: "https://api.coinbase.com/v2/exchange-rates?currency=BTC",
        commonFields: ["data.currency", "data.rates.USD", "data.rates.EUR", "data.rates.INR"]
      }
    },
    { 
      name: "Stock & Crypto Data (Twelve Data)", 
      url: "https://api.twelvedata.com/time_series?symbol=AAPL&interval=1day&outputsize=1&apikey=b0055776c7ca49f9873244ab2853648c",
      provider: "twelvedata",
      rateLimit: { requests: 8, period: "minute" },
      guide: {
        title: "Twelve Data Time Series API",
        description: "Get historical and real-time stock/crypto data",
        parameters: [
          { name: "symbol", description: "Stock ticker or crypto pair", example: "AAPL, MSFT, BTC/USD" },
          { name: "interval", description: "Time interval", example: "1min, 5min, 1day, 1week" },
          { name: "outputsize", description: "Number of data points", example: "1-5000" }
        ],
        exampleUrl: "https://api.twelvedata.com/time_series?symbol=AAPL&interval=1day&outputsize=1&apikey=b0055776c7ca49f9873244ab2853648c",
        commonFields: ["meta.symbol", "meta.interval", "values.0.open", "values.0.high", "values.0.low", "values.0.close", "values.0.volume"]
      }
    },
    { 
      name: "Stock Market Data (Alpha Vantage)", 
      url: "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=CAILWE2UT20LBDOE",
      provider: "alphavantage",
      rateLimit: { requests: 25, period: "day" },
      guide: {
        title: "Alpha Vantage Global Quote API",
        description: "Get latest stock price and trading information",
        parameters: [
          { name: "function", description: "API function", example: "GLOBAL_QUOTE, TIME_SERIES_DAILY" },
          { name: "symbol", description: "Stock ticker symbol", example: "IBM, AAPL, MSFT" }
        ],
        exampleUrl: "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=CAILWE2UT20LBDOE",
        commonFields: ["Global Quote.01. symbol", "Global Quote.05. price", "Global Quote.09. change", "Global Quote.10. change percent"]
      }
    },
  ];

  // Drag and drop handlers
  const handleDragStart = (id: number) => {
    setDraggedWidget(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: number) => {
    if (draggedWidget === null || draggedWidget === targetId) return;

    const dragIndex = widgets.findIndex((w) => w.id === draggedWidget);
    const targetIndex = widgets.findIndex((w) => w.id === targetId);

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(dragIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    setWidgets(newWidgets);
    setDraggedWidget(null);
  };

  const filteredFields = availableFields.filter((field) =>
    field.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedApiOption = apiOptions.find(opt => opt.url === apiUrl);

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <header className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                FinBoard
              </h1>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mt-1`}>
                Customizable Finance Dashboard
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportConfig}
                className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                title="Export Configuration"
              >
                <Download size={20} />
              </button>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                onClick={() => setShowModal(true)}
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Widget</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {widgets.length === 0 ? (
          <div className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-lg p-12 text-center`}>
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold mb-2">No Widgets Yet</h2>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6`}>
              Start building your dashboard by adding widgets
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add Your First Widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                onDelete={() => deleteWidget(widget.id)}
                theme={theme}
                onDragStart={() => handleDragStart(widget.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(widget.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Add New Widget</h2>
                  <p className="text-emerald-100 text-sm mt-1">
                    Configure a new widget by providing an API endpoint and selecting data fields.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Widget Name */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                  Widget Name
                </label>
                <input
                  type="text"
                  placeholder="Bitcoin Price"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none`}
                  value={widgetName}
                  onChange={(e) => setWidgetName(e.target.value)}
                />
              </div>

              {/* API URL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                    API URL
                  </label>
                  {selectedApiOption && (
                    <button
                      onClick={() => setShowApiGuide(!showApiGuide)}
                      className="text-xs text-cyan-500 hover:text-cyan-600 font-medium flex items-center gap-1"
                    >
                      {showApiGuide ? "Hide" : "Show"} API Guide
                    </button>
                  )}
                </div>

                {/* API Guide */}
                {showApiGuide && selectedApiOption?.guide && (
                  <div className={`mb-3 p-4 rounded-lg border-2 ${
                    theme === "dark" 
                      ? "bg-cyan-900/20 border-cyan-500/30" 
                      : "bg-cyan-50 border-cyan-200"
                  }`}>
                    <h4 className={`font-bold text-sm mb-2 ${theme === "dark" ? "text-cyan-400" : "text-cyan-700"}`}>
                      📘 {selectedApiOption.guide.title}
                    </h4>
                    <p className={`text-xs mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      {selectedApiOption.guide.description}
                    </p>
                    
                    <div className="space-y-2 mb-3">
                      <p className={`text-xs font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Available Parameters:
                      </p>
                      {selectedApiOption.guide.parameters.map((param, idx) => (
                        <div key={idx} className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          <span className="font-mono bg-gray-700/30 px-2 py-0.5 rounded">
                            {param.name}
                          </span>
                          {" - "}{param.description}
                          <span className="text-emerald-500 ml-1">({param.example})</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <p className={`text-xs font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Common Fields to Select:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedApiOption.guide.commonFields.map((field, idx) => (
                          <span 
                            key={idx}
                            className="text-xs font-mono bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-cyan-500/20">
                      <p className={`text-xs font-semibold mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Example URL:
                      </p>
                      <code className={`text-xs block p-2 rounded ${
                        theme === "dark" ? "bg-gray-800" : "bg-white"
                      } overflow-x-auto`}>
                        {selectedApiOption.guide.exampleUrl}
                      </code>
                    </div>
                  </div>
                )}
                
                {/* Predefined API Options */}
                {!useCustomApi && (
                  <div className="space-y-2 mb-3">
                    {apiOptions.map((option, idx) => {
                      const remaining = getRemainingCalls(option.provider, option.rateLimit.requests);
                      const resetTime = getResetTime(option.provider);
                      const percentage = (remaining / option.rateLimit.requests) * 100;
                      
                      return (
                        <label
                          key={idx}
                          className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            apiUrl === option.url
                              ? "border-emerald-500 bg-emerald-500/10"
                              : theme === "dark"
                              ? "border-gray-600 hover:border-gray-500"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="apiOption"
                              value={option.url}
                              checked={apiUrl === option.url}
                              onChange={(e) => setApiUrl(e.target.value)}
                              className="w-4 h-4 text-emerald-500"
                            />
                            <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                              {option.name}
                            </span>
                          </div>
                          
                          {/* Rate Limit Info */}
                          <div className="ml-7 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                                API Calls Remaining
                              </span>
                              <span className={`font-semibold ${
                                percentage > 50 ? "text-emerald-500" : 
                                percentage > 20 ? "text-yellow-500" : "text-red-500"
                              }`}>
                                {remaining} / {option.rateLimit.requests}
                              </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className={`h-1.5 rounded-full overflow-hidden ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                            }`}>
                              <div
                                className={`h-full transition-all duration-300 ${
                                  percentage > 50 ? "bg-emerald-500" : 
                                  percentage > 20 ? "bg-yellow-500" : "bg-red-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            
                            {resetTime && (
                              <div className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                                Resets in {resetTime}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Custom API Input */}
                {useCustomApi && (
                  <>
                    <input
                      type="text"
                      placeholder="https://api.example.com/data"
                      className={`w-full px-4 py-3 rounded-lg border mb-3 ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none`}
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                    />
                    <div className={`p-3 rounded-lg mb-3 ${
                      theme === "dark" ? "bg-yellow-900/20 border border-yellow-500/30" : "bg-yellow-50 border border-yellow-200"
                    }`}>
                      <p className={`text-xs ${theme === "dark" ? "text-yellow-400" : "text-yellow-700"}`}>
                        💡 <strong>Tip:</strong> Make sure your custom API returns JSON data and supports CORS for browser requests.
                      </p>
                    </div>
                  </>
                )}

                {/* Toggle Custom API */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomApi(!useCustomApi);
                      if (useCustomApi) {
                        setApiUrl(apiOptions[0].url);
                      }
                    }}
                    className="text-sm text-emerald-500 hover:text-emerald-600 font-medium"
                  >
                    {useCustomApi ? "← Use Predefined APIs" : "Use Custom API →"}
                  </button>

                  <button
                    onClick={fetchSample}
                    disabled={loading}
                    className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    {loading ? "Testing..." : "Test"}
                  </button>
                </div>
              </div>

              {/* Refresh Interval */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                  Refresh Interval (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none`}
                  value={refresh}
                  onChange={(e) => setRefresh(Number(e.target.value))}
                />
              </div>

              {/* Display Type Selection */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                  Select Fields to Display
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDisplayType("card")}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      displayType === "card"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                        : theme === "dark"
                        ? "border-gray-600 hover:border-gray-500"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">▦</span>
                      <span className="text-sm">Card</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDisplayType("table")}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      displayType === "table"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                        : theme === "dark"
                        ? "border-gray-600 hover:border-gray-500"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">▦</span>
                      <span className="text-sm">Table</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDisplayType("chart")}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      displayType === "chart"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                        : theme === "dark"
                        ? "border-gray-600 hover:border-gray-500"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">▦</span>
                      <span className="text-sm">Chart</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Field Selection */}
              {sample && (
                <>
                  <div className={`relative ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} rounded-lg p-3`}>
                    <Search className="absolute left-6 top-6 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search for fields..."
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                        theme === "dark"
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Available Fields */}
                    <div>
                      <h3 className={`font-semibold mb-3 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                        Available Fields
                      </h3>
                      <div className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} rounded-lg p-4 max-h-64 overflow-y-auto space-y-2`}>
                        {filteredFields.length === 0 ? (
                          <p className="text-gray-500 text-center py-8 text-sm">
                            {sample ? "No fields found" : "Test an API to see fields."}
                          </p>
                        ) : (
                          filteredFields.map((field) => {
                            const value = getFieldValue(sample, field);
                            const isSelected = selectedFields.includes(field);
                            return (
                              <button
                                key={field}
                                onClick={() => toggleField(field)}
                                disabled={isSelected}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                                  isSelected
                                    ? theme === "dark"
                                      ? "bg-gray-600 opacity-50 cursor-not-allowed"
                                      : "bg-gray-200 opacity-50 cursor-not-allowed"
                                    : theme === "dark"
                                    ? "bg-gray-600 hover:bg-emerald-600"
                                    : "bg-white hover:bg-emerald-50 border border-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-mono text-xs truncate">
                                      {field}
                                    </div>
                                    <div className={`text-xs truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                      {typeof value} | {String(value).substring(0, 20)}
                                      {String(value).length > 20 ? "..." : ""}
                                    </div>
                                  </div>
                                  {!isSelected && (
                                    <Plus size={16} className="text-emerald-500 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Selected Fields */}
                    <div>
                      <h3 className={`font-semibold mb-3 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                        Selected Fields
                      </h3>
                      <div className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} rounded-lg p-4 max-h-64 overflow-y-auto space-y-2`}>
                        {selectedFields.length === 0 ? (
                          <p className="text-gray-500 text-center py-8 text-sm">
                            No fields selected.
                          </p>
                        ) : (
                          selectedFields.map((field) => (
                            <div
                              key={field}
                              className={`px-3 py-2 rounded-lg flex items-center justify-between ${
                                theme === "dark" ? "bg-emerald-900/30 border border-emerald-500" : "bg-emerald-50 border border-emerald-300"
                              }`}
                            >
                              <span className="font-mono text-xs text-emerald-500 truncate">
                                {field}
                              </span>
                              <button
                                onClick={() => toggleField(field)}
                                className="text-red-400 hover:text-red-500 flex-shrink-0 ml-2"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`sticky bottom-0 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} border-t px-6 py-4 rounded-b-xl`}>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={addWidget}
                  disabled={!widgetName || !apiUrl || selectedFields.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  Add Widget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}