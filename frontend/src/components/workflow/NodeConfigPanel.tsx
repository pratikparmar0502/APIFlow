import React, { useState } from 'react';
import { RequestConfig, HttpMethod, AssertionConfig, ExtractionRule } from '../../types';
import { KeyValueTable } from '../ui/KeyValueTable';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Plus, Trash2, Globe, ShieldCheck, Variable, HelpCircle } from 'lucide-react';

export interface NodeConfigPanelProps {
  nodeId: string;
  label: string;
  config: RequestConfig;
  onUpdate: (config: Partial<RequestConfig>, label?: string) => void;
  onClose: () => void;
  onDeleteNode?: () => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  label,
  config,
  onUpdate,
  onClose,
  onDeleteNode,
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'assertions' | 'extraction' | 'variables'>('request');
  const [currentLabel, setCurrentLabel] = useState(label);
  const [url, setUrl] = useState(config.url || '');
  const [method, setMethod] = useState<HttpMethod>(config.method || 'GET');
  const [body, setBody] = useState(config.body || '');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync state if node changes
  React.useEffect(() => {
    setCurrentLabel(label);
    setUrl(config.url || '');
    setMethod(config.method || 'GET');
    setBody(config.body || '');
  }, [label, config]);

  const handleLabelBlur = () => {
    if (currentLabel !== label) {
      onUpdate({}, currentLabel);
    }
  };

  const handleUrlBlur = () => {
    if (url !== config.url) {
      onUpdate({ url });
    }
  };

  const handleMethodChange = (m: HttpMethod) => {
    setMethod(m);
    onUpdate({ method: m });
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    if (value.trim()) {
      try {
        JSON.parse(value);
        setJsonError(null);
      } catch (err: unknown) {
        setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      }
    } else {
      setJsonError(null);
    }
    onUpdate({ body: value });
  };

  const handleAddAssertion = () => {
    const newAssertion: AssertionConfig = {
      id: `assert_${Date.now()}`,
      type: 'status',
      operator: 'eq',
      expected: 200,
      description: 'Status code is 200',
    };
    onUpdate({
      assertions: [...(config.assertions || []), newAssertion],
    });
  };

  const handleUpdateAssertion = (index: number, updated: Partial<AssertionConfig>) => {
    const list = [...(config.assertions || [])];
    list[index] = { ...list[index], ...updated };
    onUpdate({ assertions: list });
  };

  const handleRemoveAssertion = (index: number) => {
    const list = (config.assertions || []).filter((_, i) => i !== index);
    onUpdate({ assertions: list });
  };

  const handleAddExtraction = () => {
    const newRule: ExtractionRule = {
      id: `extract_${Date.now()}`,
      variableName: `var_${(config.extractionRules || []).length + 1}`,
      source: 'responseJson',
      jsonPath: '$.id',
    };
    onUpdate({
      extractionRules: [...(config.extractionRules || []), newRule],
    });
  };

  const handleUpdateExtraction = (index: number, updated: Partial<ExtractionRule>) => {
    const list = [...(config.extractionRules || [])];
    list[index] = { ...list[index], ...updated };
    onUpdate({ extractionRules: list });
  };

  const handleRemoveExtraction = (index: number) => {
    const list = (config.extractionRules || []).filter((_, i) => i !== index);
    onUpdate({ extractionRules: list });
  };

  return (
    <div className="w-96 h-full bg-panel border-l border-border flex flex-col shadow-xl z-20">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex-1 mr-2">
          <input
            type="text"
            value={currentLabel}
            onChange={(e) => setCurrentLabel(e.target.value)}
            onBlur={handleLabelBlur}
            className="w-full bg-transparent font-semibold text-text-primary text-sm focus:outline-none focus:border-b focus:border-yellow pb-0.5"
            placeholder="Step Name"
          />
        </div>
        <div className="flex items-center gap-1">
          {onDeleteNode && (
            <button
              onClick={onDeleteNode}
              className="text-text-secondary hover:text-failure p-1.5 rounded hover:bg-failure/10 transition-colors"
              title="Delete Node"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1.5 rounded hover:bg-secondary-bg transition-colors"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-secondary-bg/50 px-2 pt-2">
        <button
          onClick={() => setActiveTab('request')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'request'
              ? 'border-yellow text-yellow'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Request
        </button>
        <button
          onClick={() => setActiveTab('assertions')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'assertions'
              ? 'border-yellow text-yellow'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Assertions ({config.assertions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('extraction')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'extraction'
              ? 'border-yellow text-yellow'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Variable className="w-3.5 h-3.5" />
          Extract ({config.extractionRules?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('variables')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'variables'
              ? 'border-yellow text-yellow'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Vars
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'request' && (
          <div className="space-y-4">
            {/* Method & URL */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">Endpoint</label>
              <div className="flex gap-2">
                <select
                  value={method}
                  onChange={(e) => handleMethodChange(e.target.value as HttpMethod)}
                  className="bg-secondary-bg border border-border rounded-lg text-xs font-mono font-semibold text-yellow px-2 py-2 focus:border-yellow focus:outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="HEAD">HEAD</option>
                </select>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  placeholder="https://api.example.com/data"
                  className="flex-1 bg-secondary-bg border border-border rounded-lg text-xs font-mono text-text-primary px-3 py-2 focus:border-yellow focus:outline-none"
                />
              </div>
            </div>

            {/* Query Params */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-medium text-text-secondary">Query Parameters</span>
              <KeyValueTable
                items={config.queryParams || []}
                onChange={(items) => onUpdate({ queryParams: items })}
                keyPlaceholder="param"
                valuePlaceholder="value"
              />
            </div>

            {/* Headers */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-medium text-text-secondary">Headers</span>
              <KeyValueTable
                items={config.headers || []}
                onChange={(items) => onUpdate({ headers: items })}
                keyPlaceholder="Header-Name"
                valuePlaceholder="Header-Value"
              />
            </div>

            {/* Body */}
            {method !== 'GET' && method !== 'HEAD' && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">JSON Body</span>
                  {jsonError ? (
                    <span className="text-[10px] text-failure">Invalid JSON</span>
                  ) : body.trim() ? (
                    <span className="text-[10px] text-success">Valid JSON</span>
                  ) : null}
                </div>
                <textarea
                  value={body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  placeholder={`{\n  "key": "value"\n}`}
                  rows={6}
                  className={`w-full bg-secondary-bg border ${
                    jsonError ? 'border-failure' : 'border-border focus:border-yellow'
                  } rounded-lg p-2.5 font-mono text-xs text-text-primary focus:outline-none`}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'assertions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">
                Assertions validate step responses
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddAssertion}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add
              </Button>
            </div>

            {(!config.assertions || config.assertions.length === 0) ? (
              <div className="text-center py-6 text-xs text-text-secondary/60 border border-dashed border-border rounded-lg">
                No assertions yet. Click &quot;Add&quot; to test status codes or payloads.
              </div>
            ) : (
              <div className="space-y-3">
                {config.assertions.map((assertion, idx) => (
                  <div
                    key={assertion.id || idx}
                    className="p-3 bg-secondary-bg border border-border rounded-lg space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <select
                        value={assertion.type}
                        onChange={(e) =>
                          handleUpdateAssertion(idx, {
                            type: e.target.value as AssertionConfig['type'],
                          })
                        }
                        className="bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary font-medium focus:border-yellow focus:outline-none"
                      >
                        <option value="status">Status Code</option>
                        <option value="jsonPath">JSON Path</option>
                        <option value="responseTime">Response Time</option>
                        <option value="exists">Exists</option>
                        <option value="typeCheck">Type Check</option>
                      </select>
                      <button
                        onClick={() => handleRemoveAssertion(idx)}
                        className="text-text-secondary hover:text-failure p-1 transition-colors"
                        title="Remove Assertion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {assertion.type === 'jsonPath' && (
                      <Input
                        placeholder="Target Path e.g. $.data.id"
                        value={assertion.target || ''}
                        onChange={(e) =>
                          handleUpdateAssertion(idx, { target: e.target.value })
                        }
                      />
                    )}

                    <div className="flex gap-2">
                      <select
                        value={assertion.operator || 'eq'}
                        onChange={(e) =>
                          handleUpdateAssertion(idx, {
                            operator: e.target.value as AssertionConfig['operator'],
                          })
                        }
                        className="bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary focus:border-yellow focus:outline-none"
                      >
                        <option value="eq">== (Equals)</option>
                        <option value="neq">!= (Not Equals)</option>
                        <option value="lt">&lt; (Less Than)</option>
                        <option value="lte">&le; (Less / Equal)</option>
                        <option value="gt">&gt; (Greater Than)</option>
                        <option value="gte">&ge; (Greater / Equal)</option>
                        <option value="contains">Contains</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Expected Value"
                        value={assertion.expected !== undefined ? String(assertion.expected) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = !isNaN(Number(val)) && val.trim() !== '' ? Number(val) : val;
                          handleUpdateAssertion(idx, { expected: parsed });
                        }}
                        className="flex-1 bg-panel border border-border rounded px-2 py-1 text-xs font-mono text-text-primary focus:border-yellow focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'extraction' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">
                Extract values into workflow variables
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddExtraction}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Rule
              </Button>
            </div>

            {(!config.extractionRules || config.extractionRules.length === 0) ? (
              <div className="text-center py-6 text-xs text-text-secondary/60 border border-dashed border-border rounded-lg">
                No extractions yet. Save tokens or IDs to reuse in subsequent nodes!
              </div>
            ) : (
              <div className="space-y-3">
                {config.extractionRules.map((rule, idx) => (
                  <div
                    key={rule.id || idx}
                    className="p-3 bg-secondary-bg border border-border rounded-lg space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-yellow font-mono text-xs">$</span>
                        <input
                          type="text"
                          placeholder="variableName"
                          value={rule.variableName}
                          onChange={(e) =>
                            handleUpdateExtraction(idx, { variableName: e.target.value })
                          }
                          className="w-full bg-panel border border-border rounded px-2 py-1 text-xs font-mono text-text-primary focus:border-yellow focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveExtraction(idx)}
                        className="text-text-secondary hover:text-failure p-1 transition-colors"
                        title="Remove Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={rule.source}
                        onChange={(e) =>
                          handleUpdateExtraction(idx, {
                            source: e.target.value as ExtractionRule['source'],
                          })
                        }
                        className="bg-panel border border-border rounded px-2 py-1 text-xs text-text-primary focus:border-yellow focus:outline-none"
                      >
                        <option value="responseJson">JSON Body</option>
                        <option value="responseHeader">Header</option>
                        <option value="responseStatus">Status Code</option>
                      </select>

                      {rule.source === 'responseJson' ? (
                        <input
                          type="text"
                          placeholder="JSONPath e.g. $.token"
                          value={rule.jsonPath || ''}
                          onChange={(e) =>
                            handleUpdateExtraction(idx, { jsonPath: e.target.value })
                          }
                          className="bg-panel border border-border rounded px-2 py-1 text-xs font-mono text-text-primary focus:border-yellow focus:outline-none"
                        />
                      ) : rule.source === 'responseHeader' ? (
                        <input
                          type="text"
                          placeholder="Header Name"
                          value={rule.headerName || ''}
                          onChange={(e) =>
                            handleUpdateExtraction(idx, { headerName: e.target.value })
                          }
                          className="bg-panel border border-border rounded px-2 py-1 text-xs font-mono text-text-primary focus:border-yellow focus:outline-none"
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="space-y-3 text-xs text-text-secondary">
            <h4 className="font-semibold text-text-primary text-sm">Variable Interpolation</h4>
            <p>
              Use curly brackets <code className="text-yellow bg-secondary-bg px-1.5 py-0.5 rounded font-mono">{"{{variableName}}"}</code> in URLs, Headers, and Request Body to substitute extracted values.
            </p>
            <div className="p-3 bg-secondary-bg border border-border rounded-lg space-y-1.5">
              <span className="font-medium text-text-primary block">Examples:</span>
              <p className="font-mono text-[11px] text-text-secondary">https://api.example.com/users/{"{{userId}}"}</p>
              <p className="font-mono text-[11px] text-text-secondary">Authorization: Bearer {"{{authToken}}"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
