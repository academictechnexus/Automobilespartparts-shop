import { useState, useEffect } from 'react';
import { getCustomFields, renderCustomField, displayCustomValue } from '../lib/customFields';

/**
 * useCustomFields(module)
 * Returns fields + values + change handler + renderers
 * Use this in any form to plug in custom fields
 */
export const useCustomFields = (module) => {
  const [fields, setFields]   = useState([]);
  const [values, setValues]   = useState({});

  useEffect(() => {
    setFields(getCustomFields(module));
  }, [module]);

  const setValue = (fieldName, val) => {
    setValues(prev => ({ ...prev, [fieldName]: val }));
  };

  // Load existing values (when editing a record)
  const loadValues = (record) => {
    if (!record?.custom_fields) return;
    setValues(record.custom_fields || {});
  };

  // Get object to save with record
  const getCustomData = () => ({ custom_fields: values });

  return { fields, values, setValue, loadValues, getCustomData };
};

/**
 * CustomFieldsSection
 * Drop this component into any form to render all custom fields for a module
 */
export const CustomFieldsSection = ({ module, values, onChange }) => {
  const [fields, setFields] = useState([]);

  useEffect(() => {
    setFields(getCustomFields(module));
  }, [module]);

  if (fields.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-orange-500 rounded-full"/>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Additional Fields</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map(field => (
          <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
            <label className="text-gray-400 text-xs mb-1.5 block">
              {field.label}
              {field.required && <span className="text-orange-400 ml-0.5">*</span>}
            </label>
            {renderCustomField(field, values?.[field.name], (val) => onChange(field.name, val))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * CustomFieldsDisplay
 * Shows custom field values in read-only view (invoice view, part view etc.)
 */
export const CustomFieldsDisplay = ({ module, record }) => {
  const [fields, setFields] = useState([]);

  useEffect(() => {
    setFields(getCustomFields(module));
  }, [module]);

  const customValues = record?.custom_fields || {};
  const filledFields = fields.filter(f => customValues[f.name] !== undefined && customValues[f.name] !== '');

  if (filledFields.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      <p className="text-gray-600 text-xs mb-2 uppercase tracking-wide">Additional Info</p>
      <div className="grid grid-cols-2 gap-2">
        {filledFields.map(field => (
          <div key={field.id}>
            <span className="text-gray-500 text-xs">{field.label}: </span>
            <span className="text-gray-300 text-xs font-medium">{displayCustomValue(field, customValues[field.name])}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * CustomFieldColumns
 * Returns extra table column definitions for list views
 */
export const getCustomColumns = (module) => {
  return getCustomFields(module).filter(f => f.show_in_list);
};
