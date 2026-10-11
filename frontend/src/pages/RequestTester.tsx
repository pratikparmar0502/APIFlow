import React, { useState } from 'react';
import { Send, Copy, Check, Clock, Database, Layers } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { KeyValueTable, KeyValueItem } from '../components/ui/KeyValueTable';
import { JsonViewer } from '../components/ui/JsonViewer';
import { executeRequest } from '../api/requests';
import { HttpMethod, ExecuteRequestResult } from '../types';
import toast from 'react-hot-toast';

export const RequestTester: React.FC = () => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [activeReqTab, setActiveReqTab] = useState<'params' | 'headers' | 'body'>('params');
  const [activeResTab, setActiveResTab] = useState<'body' | 'headers' | 'info'>('body');

  const [queryParams, setQueryParams] = useState<KeyValueItem[]>([]);
  const [headers, setHeaders] = useState<KeyValueItem[]>([
    { key: 'Accept', value: 'application/json', enabled: true },
  ]);
  const [bodyText, setBodyText] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ExecuteRequestResult | null>(null);

  const handleSend = async () => {
    if (!url.trim()) {
      toast.error('URL is required');
      return;
    }

    try {
      setLoading(true);

      // Build query string if any enabled
      let targetUrl = url.trim();
      const enabledParams = queryParams.filter((p) => p.enabled && p.key.trim());
      if (enabledParams.length > 0) {
        const queryStr = enabledParams
          .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&');
        targetUrl += targetUrl.includes('?') ? `&${queryStr}` : `?${queryStr}`;
      }

      // Headers map
      const headersRecord: Record<string, string> = {};
      headers
        .filter((h) => h.enabled && h.key.trim())
        .forEach((h) => {
          headersRecord[h.key.trim()] = h.value;
        });

      const res = await executeRequest({
        url: targetUrl,
        method,
        headers: headersRecord,
        body: method !== 'GET' && method !== 'HEAD' ? bodyText : undefined,
      });

      setResponse(res);
      if (res.status >= 200 && res.status < 400) {
        toast.success(`Success (${res.status} OK)`);
      } else {
        toast.error(`Status ${res.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-success bg-success/10 border-success/30';
    if (status >= 300 && status < 400) return 'text-warning bg-warning/10 border-warning/30';
    return 'text-failure bg-failure/10 border-failure/30';
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="API Explorer" />

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Request Bar */}
        <div className="p-4 bg-panel border border-border rounded-xl shadow-sm flex flex-col md:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="bg-secondary-bg border border-border rounded-lg text-xs font-mono font-bold text-yellow px-3 py-2.5 focus:border-yellow focus:outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="HEAD">HEAD</option>
            </select>
          </div>

          <div className="flex-1 w-full">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/v1/resource"
              className="w-full bg-secondary-bg border border-border rounded-lg px-3.5 py-2 text-xs font-mono text-text-primary focus:border-yellow focus:outline-none"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleSend}
            isLoading={loading}
            icon={<Send className="w-3.5 h-3.5" />}
            className="w-full md:w-auto shrink-0"
          >
            Send Request
          </Button>
        </div>

        {/* Two Columns: Request Configuration vs Response */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Request Config Panel */}
          <div className="bg-panel border border-border rounded-xl flex flex-col overflow-hidden">
            <div className="flex border-b border-border bg-secondary-bg/40 px-3 pt-2">
              <button
                onClick={() => setActiveReqTab('params')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeReqTab === 'params'
                    ? 'border-yellow text-yellow'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Params ({queryParams.filter((p) => p.enabled && p.key).length})
              </button>
              <button
                onClick={() => setActiveReqTab('headers')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeReqTab === 'headers'
                    ? 'border-yellow text-yellow'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Headers ({headers.filter((h) => h.enabled && h.key).length})
              </button>
              {method !== 'GET' && method !== 'HEAD' && (
                <button
                  onClick={() => setActiveReqTab('body')}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeReqTab === 'body'
                      ? 'border-yellow text-yellow'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  JSON Body
                </button>
              )}
            </div>

            <div className="p-4 min-h-[300px]">
              {activeReqTab === 'params' && (
                <KeyValueTable
                  items={queryParams}
                  onChange={setQueryParams}
                  keyPlaceholder="parameter"
                  valuePlaceholder="value"
                />
              )}

              {activeReqTab === 'headers' && (
                <KeyValueTable
                  items={headers}
                  onChange={setHeaders}
                  keyPlaceholder="Header"
                  valuePlaceholder="Value"
                />
              )}

              {activeReqTab === 'body' && (
                <div className="space-y-2">
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={12}
                    className="w-full bg-secondary-bg border border-border rounded-lg p-3 font-mono text-xs text-text-primary focus:border-yellow focus:outline-none"
                    placeholder="Raw JSON body"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Response Viewer Panel */}
          <div className="bg-panel border border-border rounded-xl flex flex-col overflow-hidden">
            {/* Response status bar */}
            <div className="p-3 bg-secondary-bg border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-text-primary">Response</span>
                {response && (
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${getStatusColor(
                      response.status
                    )}`}
                  >
                    {response.status}
                  </span>
                )}
              </div>

              {response && (
                <div className="flex items-center gap-4 text-xs font-mono text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {response.durationMs}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    {response.body ? `${(response.body.length / 1024).toFixed(1)} KB` : '0 B'}
                  </span>
                </div>
              )}
            </div>

            {/* Response Tabs */}
            {response && (
              <div className="flex border-b border-border bg-secondary-bg/20 px-3 pt-2">
                <button
                  onClick={() => setActiveResTab('body')}
                  className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                    activeResTab === 'body'
                      ? 'border-yellow text-yellow'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Body
                </button>
                <button
                  onClick={() => setActiveResTab('headers')}
                  className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                    activeResTab === 'headers'
                      ? 'border-yellow text-yellow'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Headers ({Object.keys(response.headers || {}).length})
                </button>
              </div>
            )}

            {/* Response Content */}
            <div className="p-4 min-h-[300px] overflow-y-auto">
              {!response ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary py-16 space-y-2">
                  <Send className="w-6 h-6 text-text-secondary/40" />
                  <p className="text-xs">Click &quot;Send Request&quot; to inspect response status, body, and headers.</p>
                </div>
              ) : activeResTab === 'body' ? (
                <JsonViewer data={response.body} />
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {Object.entries(response.headers || {}).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between p-2 bg-secondary-bg rounded border border-border/50 text-xs font-mono"
                    >
                      <span className="text-text-secondary">{k}:</span>
                      <span className="text-text-primary truncate max-w-xs">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
