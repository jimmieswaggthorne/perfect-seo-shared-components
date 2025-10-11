import { FormEvent, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import useFormInput from '@/perfect-seo-shared-components/hooks/useFormInput';
import FieldErrors from '@/perfect-seo-shared-components/components/Form/FieldErrors';
import FormField from '@/perfect-seo-shared-components/components/Form/FormField';

interface OptionProps extends React.HTMLProps<HTMLOptionElement> { }

export const Option = (props: OptionProps) => (
  <option {...props} />
);

interface SelectProps extends React.HTMLProps<HTMLSelectElement> {
  fieldName: string;
  error?: string;
  icon?: React.ReactNode;
  label?: string;
  bottomSpacing?: boolean;
}

export const Select = ({
  children,
  error,
  icon,
  label,
  fieldName,
  required,
  type,
  className,
  disabled,
  bottomSpacing = true,
  readOnly,
  onChange,
  placeholder,
  ...props
}: SelectProps) => {
  const { errors, hasErrors, form, inputRef } = useFormInput({
    fieldName,
    error,
    required,
  });

  // Store the current selected value in state, so that
  // we may apply a special class to the select element
  // when a valid option is selected, allowing a visually
  // differentiated placeholder state.
  const value = useMemo(() => {
    if (!!props.value) {
      return props.value;
    } else if (form.getState[fieldName]) {
      return form.getState[fieldName];
    } else {
      return '';
    }
  }, [props?.value, form.getState[fieldName]]);

  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    if (value) {
      setSelectedValue(value);
    } else {
      setSelectedValue('default');
    }
  }, [value]);

  function handleInputChange(e: FormEvent<HTMLSelectElement>) {
    const target = e.target as HTMLSelectElement;

    form.handleInputChange(e);

    setSelectedValue(target.value);
    if (onChange) {
      onChange(e);
    }
  }

  // Determine classes/aria props
  const inputClass = 'select-input';

  const inputClassNames = classNames(`${inputClass} form-select form-control`, {
    [`${inputClass}_withSelection`]: (selectedValue !== 'default' && selectedValue),
    [`${inputClass}_withIcon`]: !!icon,
    [`${inputClass}_withError`]: hasErrors,
    [`${className}`]: className,
  });

  const ariaProps = {
    'aria-invalid': hasErrors,
    'aria-describedby': hasErrors ? `fieldError-${fieldName}` : undefined,
    'aria-required': !!required,
  };

  const containerClasses = classNames('select-container', {
    'select-container_withError': hasErrors,
  },
  );

  return (
    <FormField fieldName={fieldName} label={label} bottomSpacing={bottomSpacing}>
      <div className={containerClasses}>
        <select
          {...props}
          {...ariaProps}
          value={selectedValue}
          onChange={handleInputChange}
          className={inputClassNames}
          name={fieldName}
          disabled={readOnly || disabled}
          id={fieldName}
          ref={inputRef}
          required={required}
        >
          <Option value="default" className="select-container-placeholder" disabled>{placeholder || 'Select'}</Option>
          {children}
        </select>
        {icon && (
          <div className="select-icon">
            {icon}
          </div>
        )}
      </div>
      {hasErrors && (
        <FieldErrors
          id={`fieldError-${fieldName}`}
          errors={errors}
        />
      )}
    </FormField>
  );
};
