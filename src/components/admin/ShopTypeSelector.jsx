import { useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { SHOP_TYPES, getCurrentShopType, setShopType } from '../../lib/shopConfig';

export default function ShopTypeSelector() {
  const [current,   setCurrent]   = useState(getCurrentShopType());
  const [selected,  setSelected]  = useState(getCurrentShopType());
  const [confirming, setConfirming] = useState(false);

  const currentConfig  = SHOP_TYPES[current];
  const selectedConfig = SHOP_TYPES[selected];

  const handleApply = () => {
    if (selected === current) return;
    setConfirming(true);
  };

  const handleConfirm = () => {
    setShopType(selected); // reloads page
  };

  const colorMap = {
    orange: 'border-orange-500 bg-orange-500/10',
    blue:   'border-blue-500 bg-blue-500/10',
    green:  'border-green-500 bg-green-500/10',
    purple: 'border-purple-500 bg-purple-500/10',
    yellow: 'border-yellow-500 bg-yellow-500/10',
    pink:   'border-pink-500 bg-pink-500/10',
  };
  const textColorMap = {
    orange: 'text-orange-400', blue: 'text-blue-400', green: 'text-green-400',
    purple: 'text-purple-400', yellow: 'text-yellow-400', pink: 'text-pink-400',
  };

  if (confirming) return (
    <div className="space-y-4">
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h3 className="text-white font-bold text-lg">Change Shop Type?</h3>
        <p className="text-gray-400 text-sm">
          Changing from <strong className="text-white">{currentConfig?.label}</strong> to <strong className="text-white">{selectedConfig?.label}</strong> will:
        </p>
        <ul className="text-gray-400 text-sm space-y-1 text-left max-w-sm mx-auto">
          <li>✓ Change inventory categories to {selectedConfig?.label} categories</li>
          <li>✓ Update field labels throughout the app</li>
          <li>✓ Show/hide relevant fields (e.g. vehicle fields)</li>
          <li>✓ Change default units and GST rates</li>
          <li className="text-yellow-400">⚠ Your existing data will NOT be deleted</li>
          <li className="text-yellow-400">⚠ Page will reload to apply changes</li>
        </ul>
        <div className="flex gap-3 max-w-xs mx-auto">
          <button onClick={() => setConfirming(false)}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <RefreshCw size={14}/> Apply & Reload
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          🏪 Shop Type Configuration
        </h3>
        <p className="text-gray-500 text-xs mt-1">
          Select your business type to customize labels, categories, fields, and GST rates throughout the app.
        </p>
      </div>

      {/* Currently active */}
      <div className="bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
        <CheckCircle size={16} className="text-green-400 flex-shrink-0"/>
        <div>
          <p className="text-green-400 text-sm font-semibold">
            Currently Active: {currentConfig?.icon} {currentConfig?.label}
          </p>
          <p className="text-gray-500 text-xs">{currentConfig?.desc}</p>
        </div>
      </div>

      {/* Shop type grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.values(SHOP_TYPES).map(type => {
          const isSelected = selected === type.key;
          const isCurrent  = current  === type.key;
          return (
            <button key={type.key} onClick={() => setSelected(type.key)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected ? colorMap[type.color] : 'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <p className={`font-semibold text-sm ${isSelected ? textColorMap[type.color] : 'text-white'}`}>{type.label}</p>
                    {isCurrent && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Active</span>}
                  </div>
                </div>
                {isSelected && <CheckCircle size={16} className={textColorMap[type.color]}/>}
              </div>
              <p className="text-gray-500 text-xs mb-2">{type.desc}</p>
              <div className="flex flex-wrap gap-1">
                {type.categories.slice(0,4).map(c => (
                  <span key={c} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{c}</span>
                ))}
                {type.categories.length > 4 && <span className="text-xs text-gray-600">+{type.categories.length-4} more</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* What changes preview */}
      {selectedConfig && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h4 className="text-white font-semibold text-sm">What changes with {selectedConfig.icon} {selectedConfig.label}:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { label: 'Item Called',      val: selectedConfig.itemLabel },
              { label: 'Code Field',       val: selectedConfig.codeLabel },
              { label: 'Default GST',      val: selectedConfig.defaultGST + '%' },
              { label: 'Default Unit',     val: selectedConfig.units[0] },
              { label: 'Job Cards',        val: selectedConfig.showJobCards ? '✓ ' + selectedConfig.jobCardLabel : '✗ Hidden' },
              { label: 'Vehicle Fields',   val: selectedConfig.vehicleFields ? '✓ Shown' : '✗ Hidden' },
              { label: 'Categories',       val: selectedConfig.categories.length + ' categories' },
              { label: 'Common GST Rates', val: selectedConfig.commonGST.join('%, ') + '%' },
              { label: 'HSN Suggestion',   val: selectedConfig.hsnSuggestion },
            ].map(item => (
              <div key={item.label} className="bg-gray-800 rounded-lg p-2">
                <p className="text-gray-500 text-xs">{item.label}</p>
                <p className="text-white text-xs font-medium mt-0.5">{item.val}</p>
              </div>
            ))}
          </div>
          {selectedConfig.extraInventoryFields?.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-1.5">Extra fields added to inventory:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedConfig.extraInventoryFields.map(f => (
                  <span key={f.name} className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{f.label}</span>
                ))}
              </div>
            </div>
          )}
          <p className="text-gray-600 text-xs">Default invoice terms: "{selectedConfig.defaultTerms}"</p>
        </div>
      )}

      {/* Apply button */}
      {selected !== current && (
        <button onClick={handleApply}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">
          Apply {selectedConfig?.icon} {selectedConfig?.label} Configuration
        </button>
      )}

      {selected === current && (
        <div className="text-center text-gray-600 text-sm py-2">
          ✓ This shop type is already active
        </div>
      )}

      {/* How to customize further */}
      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
        <p className="text-blue-400 font-semibold text-sm mb-2">💡 Want more customization?</p>
        <ul className="text-gray-400 text-xs space-y-1">
          <li>• Go to <strong className="text-white">Admin → Custom Fields</strong> to add fields specific to your shop</li>
          <li>• Go to <strong className="text-white">Settings → Alerts</strong> to toggle features on/off</li>
          <li>• Go to <strong className="text-white">Settings → Billing</strong> to set your invoice prefix and terms</li>
          <li>• Contact your developer to add a completely new shop type to the config file</li>
        </ul>
      </div>
    </div>
  );
}
