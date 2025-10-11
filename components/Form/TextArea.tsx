import classNames from 'classnames';
import FieldErrors from './FieldErrors';
import FormField from './FormField';
import useFormInput from '@/perfect-seo-shared-components/hooks/useFormInput';
import { Validator } from '@/perfect-seo-shared-components/utils/validators';
import { useEffect } from 'react';

interface TextAreaInputProps extends React.HTMLProps<HTMLTextAreaElement> {
  fieldName: string;
  borderless?: boolean;
  error?: string;
  icon?: React.ReactNode;
  label?: any;
  validator?: Validator;
  className?: string;
  hideErrorMessage?: boolean;
  bottomSpacing?: boolean;
  button?: any;
  hint?: string
}

const TextArea = ({
  error,
  label,
  fieldName,
  required = false,
  hint,
  validator,
  bottomSpacing,
  type = "text",
  value,
  className,
  ...props
}: TextAreaInputProps) => {
  const { errors, hasErrors, form, inputRef } = useFormInput({
    fieldName,
    error,
    required,
    validator,
  });

  const inputClass = 'textArea-input';



  const inputClassNames = classNames(`${inputClass} form-control`, {
    [`${inputClass}_withError`]: hasErrors,
    [`${className}`]: className,
    [`${inputClass}_disabled`]: props.disabled,
    [`${inputClass}_button`]: props.button,
  });

  const ariaProps = {
    'aria-invalid': hasErrors,
    'aria-describedby': hasErrors ? `fieldError-${fieldName}` : undefined,
    'aria-required': !!required,
  };

  function onChange(e) {
    e.preventDefault()
    form.handleInputChange(e);
    if (props.onChange) {
      props.onChange?.(e);
    }
  }

  return (
    <FormField hint={hint} fieldName={fieldName} label={label} bottomSpacing={bottomSpacing}>
      <div className="textArea-container">
        <textarea
          {...props}
          {...ariaProps}
          value={form.getState[fieldName] || value}
          onChange={onChange}
          className={inputClassNames}
          name={fieldName}
          id={fieldName}
          ref={inputRef}
        />
        {props.button && <div className='input-button'>{props.button}</div>}
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



export default TextArea;