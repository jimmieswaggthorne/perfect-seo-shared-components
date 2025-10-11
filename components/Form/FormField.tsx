import React from 'react';
import classNames from 'classnames';

interface FormFieldProps {
  children: React.ReactNode,
  fieldName: string,
  label?: string | any,
  renderChildrenFirst?: boolean;
  withCheckbox?: boolean;
  className?: string;
  bottomSpacing?: boolean;
  hint?: string
}

const FormField = ({
  children,
  label,
  fieldName,
  renderChildrenFirst,
  withCheckbox,
  className,
  bottomSpacing = true,
  hint
}: FormFieldProps) => {
  const formFieldClasses = classNames('formField', {
    'formField_withCheckbox': withCheckbox,
    [`${className}`]: className,
    'formField_bottomSpacing': bottomSpacing,
  });

  const labelNode = label ? (
    <label className="formField-label" htmlFor={fieldName} key={`${fieldName}-label`}>
      {label}
      {hint && <p className="formField-hint text-wrap">{hint}</p>}
    </label>
  ) : null;

  const childrenNode = (
    <React.Fragment key={`${fieldName}-children`}>{children}</React.Fragment>
  );

  const content = withCheckbox ? [childrenNode] : [labelNode, childrenNode];

  return (
    <div className={formFieldClasses}>
      {renderChildrenFirst ? content.reverse() : content}
    </div>
  );
};

export default FormField;


