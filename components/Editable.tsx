import React, { useState, useEffect, useRef } from 'react';

interface EditableProps {
  value: string;
  isEditing: boolean;
  onSave: (val: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const Editable: React.FC<EditableProps> = ({
  value,
  isEditing,
  onSave,
  className = "",
  multiline = false,
  placeholder = "Click to edit...",
  tag: Tag = 'span'
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    onSave(e.target.value);
  };

  if (!isEditing) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  const baseInputStyles = `bg-yellow-50 border-b-2 border-academic-600 focus:outline-none focus:bg-white transition-colors w-full ${className}`;

  if (multiline) {
    return (
      <textarea
        value={localValue}
        onChange={handleChange}
        className={`${baseInputStyles} min-h-[100px] resize-y p-1`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      className={`${baseInputStyles} p-0`}
      placeholder={placeholder}
    />
  );
};
