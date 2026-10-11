import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';

export interface KeyValueItem {
  key: string;
  value: string;
  enabled: boolean;
}

export interface KeyValueTableProps {
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export const KeyValueTable: React.FC<KeyValueTableProps> = ({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}) => {
  const handleItemChange = (
    index: number,
    field: keyof KeyValueItem,
    value: string | boolean
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const handleAdd = () => {
    onChange([...items, { key: '', value: '', enabled: true }]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-text-secondary px-1 mb-1">
        <span>Name & Value pairs</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Row
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-4 text-xs text-text-secondary/70 border border-dashed border-border rounded-lg">
          No items added yet. Click &quot;Add Row&quot; to add one.
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) =>
                  handleItemChange(index, 'enabled', e.target.checked)
                }
                className="rounded border-border bg-secondary-bg text-yellow focus:ring-yellow focus:ring-offset-app-bg h-4 w-4"
              />
              <input
                type="text"
                placeholder={keyPlaceholder}
                value={item.key}
                onChange={(e) =>
                  handleItemChange(index, 'key', e.target.value)
                }
                className="flex-1 px-2.5 py-1.5 bg-secondary-bg border border-border rounded text-xs font-mono text-text-primary focus:border-yellow focus:outline-none"
              />
              <input
                type="text"
                placeholder={valuePlaceholder}
                value={item.value}
                onChange={(e) =>
                  handleItemChange(index, 'value', e.target.value)
                }
                className="flex-1 px-2.5 py-1.5 bg-secondary-bg border border-border rounded text-xs font-mono text-text-primary focus:border-yellow focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1.5 text-text-secondary hover:text-failure hover:bg-failure/10 rounded transition-colors"
                title="Delete Row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
