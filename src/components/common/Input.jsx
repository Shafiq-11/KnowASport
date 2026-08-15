import { forwardRef } from 'react';

/**
 * KnowASport Input
 * Consistent form input with label, helper text, error state, and phone number sanitization
 */
const Input = forwardRef(function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helper,
  helperText,
  disabled = false,
  required = false,
  isPhone = false,
  icon = null,
  iconPosition = 'left',
  suffix = null,
  className = '',
  inputClassName = '',
  maxLength,
  ...props
}, ref) {
  const hasError = Boolean(error);
  const activeHelper = helper || helperText;
  const isTelType = type === 'tel' || isPhone;

  const handleChange = (e) => {
    if (isTelType) {
      // Strip non-digits and cap at 10 digits
      const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
      e.target.value = sanitized;
      onChange?.({ ...e, target: { ...e.target, value: sanitized } });
    } else {
      onChange?.(e);
    }
  };

  const inputBase = `
    w-full font-medium text-sm text-neutral-900 bg-white
    border rounded-[8px] px-3 py-2.5
    placeholder:text-neutral-400 placeholder:font-normal
    transition-colors duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-neutral-50
  `;

  const inputState = hasError
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : 'border-neutral-200 focus:border-amber-400 focus:ring-amber-100 hover:border-neutral-300';

  const paddingLeft = icon && iconPosition === 'left' ? 'pl-10' : '';
  const paddingRight = (icon && iconPosition === 'right') || suffix ? 'pr-10' : '';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-neutral-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Left icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={isTelType ? 10 : maxLength}
          inputMode={isTelType ? 'numeric' : props.inputMode}
          autoComplete={isTelType ? 'tel' : props.autoComplete}
          className={[inputBase, inputState, paddingLeft, paddingRight, inputClassName].join(' ')}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : activeHelper ? `${id}-helper` : undefined}
          {...props}
        />

        {/* Right icon or suffix */}
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {icon}
          </div>
        )}
        {suffix && !icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none">
            {suffix}
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p id={`${id}-error`} className="text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}

      {/* Helper text */}
      {!hasError && activeHelper && (
        <p id={`${id}-helper`} className="text-xs text-neutral-500">
          {activeHelper}
        </p>
      )}
    </div>
  );
});

export default Input;
