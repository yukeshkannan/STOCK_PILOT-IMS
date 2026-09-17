import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * CustomSelect - Ultra-Modern, Theme-Aware Dropdown Component
 * Styled with Knack Berry Plum accent (#982A86), smooth animations,
 * search filtering, keyboard navigation, and full backwards compatibility.
 */
export default function CustomSelect({
  value,
  onChange,
  options = null,
  children,
  placeholder = 'Select an option...',
  name,
  id,
  disabled = false,
  searchable = undefined, // Auto-enables if options > 7 unless explicitly set
  className = '',
  style = {},
  triggerStyle = {},
  menuStyle = {},
  size = 'md', // 'sm' | 'md' | 'lg'
  icon = null,
  clearable = false,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options from either `options` prop or `children` (<option> tags)
  const normalizedOptions = useMemo(() => {
    if (options && Array.isArray(options)) {
      return options.map((opt) => {
        if (typeof opt === 'object' && opt !== null) {
          return {
            value: opt.value !== undefined ? opt.value : (opt.id !== undefined ? opt.id : ''),
            label: opt.label !== undefined ? opt.label : (opt.name || opt.title || String(opt.value)),
            disabled: !!opt.disabled,
            icon: opt.icon || null,
            badge: opt.badge || null,
            description: opt.description || null
          };
        }
        return {
          value: opt,
          label: String(opt),
          disabled: false,
          icon: null,
          badge: null,
          description: null
        };
      });
    }

    // Parse children if provided
    if (children) {
      const parsed = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          parsed.push({
            value: child.props.value !== undefined ? child.props.value : child.props.children,
            label: child.props.children || child.props.value,
            disabled: !!child.props.disabled,
            icon: null,
            badge: null,
            description: null
          });
        }
      });
      return parsed;
    }

    return [];
  }, [options, children]);

  // Find currently selected option object
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      String(opt.label).toLowerCase().includes(q) ||
      String(opt.value).toLowerCase().includes(q) ||
      (opt.description && String(opt.description).toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Auto determine if search box is needed
  const showSearch = searchable !== undefined ? searchable : normalizedOptions.length > 7;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (isOpen) {
      // Find initial highlighted index based on current value
      const idx = filteredOptions.findIndex((opt) => String(opt.value) === String(value));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, showSearch]);

  const handleSelect = (option) => {
    if (option.disabled) return;
    
    // Create standard synthetic event so it's drop-in compatible with e.target.value
    const syntheticEvent = {
      target: {
        name: name || id || '',
        value: option.value
      },
      currentTarget: {
        name: name || id || '',
        value: option.value
      },
      preventDefault: () => {},
      stopPropagation: () => {}
    };

    if (typeof onChange === 'function') {
      onChange(syntheticEvent);
    }

    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    handleSelect({ value: '', label: '', disabled: false });
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const activeEl = listRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Size specific styles
  const sizeClasses = {
    sm: 'custom-select-sm',
    md: 'custom-select-md',
    lg: 'custom-select-lg'
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-wrapper ${sizeClasses[size] || ''} ${disabled ? 'disabled' : ''} ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form submission / validation */}
      <input
        type="hidden"
        name={name}
        id={id}
        value={value !== undefined && value !== null ? value : ''}
        required={required}
      />

      {/* Trigger Button */}
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={triggerStyle}
      >
        <div className="custom-select-trigger-content">
          {icon && <span className="custom-select-icon">{icon}</span>}
          <span className={`custom-select-label ${!selectedOption || selectedOption.value === '' ? 'placeholder' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="custom-select-trigger-actions">
          {clearable && value && !disabled && (
            <span
              className="custom-select-clear-btn"
              onClick={handleClear}
              title="Clear selection"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`custom-select-arrow ${isOpen ? 'rotated' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div className="custom-select-dropdown" style={menuStyle}>
          {showSearch && (
            <div className="custom-select-search-container">
              <Search size={14} className="custom-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="custom-select-search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="custom-select-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          <div
            ref={listRef}
            className="custom-select-options-list"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className="custom-select-empty">
                No matching options
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = String(option.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={`${option.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`custom-select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${option.disabled ? 'disabled' : ''}`}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div className="custom-select-option-content">
                      {option.icon && (
                        <span className="custom-select-option-icon">{option.icon}</span>
                      )}
                      <div>
                        <div className="custom-select-option-label">{option.label}</div>
                        {option.description && (
                          <div className="custom-select-option-desc">{option.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="custom-select-option-end">
                      {option.badge && (
                        <span className="custom-select-option-badge">{option.badge}</span>
                      )}
                      {isSelected && (
                        <Check size={15} className="custom-select-check-icon" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
