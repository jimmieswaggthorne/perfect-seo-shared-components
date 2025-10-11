import { Validator } from '@/perfect-seo-shared-components/utils/validators';
import classNames from 'classnames';
import FormField from './FormField';
import useFormInput from '@/perfect-seo-shared-components/hooks/useFormInput';
import FieldErrors from './FieldErrors';
import { useEffect, useState } from 'react';
import * as Modal from '@/perfect-seo-shared-components/components/Modal/Modal';

interface ListInputProps extends React.HTMLProps<HTMLInputElement> {
  fieldName: string;
  borderless?: boolean;
  error?: string;
  icon?: React.ReactNode;
  label?: string | any;
  validator?: Validator;
  className?: string;
  hideErrorMessage?: boolean;
  autoComplete?: string
  bottomSpacing?: boolean
  long?: boolean
  hide_upload?: boolean;
}

const ListInput = ({
  borderless,
  bottomSpacing = true,
  error,
  icon,
  label,
  fieldName,
  required,
  type = 'text',
  validator,
  className,
  hideErrorMessage,
  autoComplete,
  autoFocus,
  long,
  onPaste,
  hide_upload = false,
  ...props
}: ListInputProps) => {
  const { errors, hasErrors, form, inputRef } = useFormInput({
    fieldName,
    error,
    required,
    validator,
  });

  const inputClass = '-input';

  const [values, setValues] = useState<string[]>([])
  const [addOn, setAddOn] = useState("")
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [replaceMode, setReplaceMode] = useState(false)


  const ariaProps = {
    'aria-invalid': hasErrors,
    'aria-describedby': hasErrors ? `fieldError-${fieldName}` : undefined,
    'aria-required': !!required,
  };


  function onChange(e) {
    form.handleInputChange(e);
    props.onChange?.(e);
    let value = e.target.value
    if (value.includes("|")) {
      setValues(value?.split("|"))
    }
    else if (value.includes(", ")) {
      setValues(value?.split(", "))
    }
  }

  useEffect(() => {
    let value = props.value ?? form.getState[fieldName] ?? ''
    if (value.includes("|")) {
      setValues(value?.split("|"))
    }
    else if (value.includes(", ")) {
      setValues(value?.split(", "))
    }
    else if (value.includes(",")) {
      setValues(value?.split(","))
    }
    else if (value) {
      setValues([value])
    }
  }, [props.value])

  // CSV upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCsvFile(file || null);
    setCsvError(null);
  };

  const handleCsvImport = () => {
    if (!csvFile) {
      setCsvError('Please select a CSV file');
      return;
    }

    // Show warning if replacing and there are existing values
    if (replaceMode && values.length > 0) {
      const confirmReplace = window.confirm(
        `Are you sure you want to replace all ${values.length} existing items with the imported CSV data? This action cannot be undone.`
      );
      if (!confirmReplace) {
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setCsvError('File is empty');
          return;
        }

        // Parse CSV - split by newlines and commas, trim whitespace, filter empty values
        const items = text
          .split(/\r?\n/)
          .flatMap(line => line.split(','))
          .map(item => item.trim())
          .filter(item => item.length > 0);

        if (items.length === 0) {
          setCsvError('No valid data found in CSV file');
          return;
        }

        // Update form state using the pattern from useForm
        const newFormState = { ...form.getState };
        let finalItems: string[];

        if (replaceMode) {
          // Replace existing items
          finalItems = items;
        } else {
          // Prepend to existing items (avoid duplicates)
          const existingItems = values;
          const uniqueNewItems = items.filter(item => !existingItems.includes(item));
          finalItems = [...uniqueNewItems, ...existingItems];
        }

        newFormState[fieldName] = finalItems.join(" | ");
        form.setState(newFormState);

        // Update local state
        setValues(finalItems);

        // Close modal and reset
        setShowImportModal(false);
        setCsvFile(null);
        setCsvError(null);
        setReplaceMode(false);
      } catch (error) {
        setCsvError('Error reading CSV file');
      }
    };

    reader.onerror = () => {
      setCsvError('Error reading file');
    };

    reader.readAsText(csvFile);
  };

  const handleAdd = (e) => {
    e.preventDefault()
    let newFormState = { ...form.getState };
    let newValues = [...values, addOn]
    setValues(newValues)
    newFormState[fieldName] = newValues.join(" | ")
    form.setState(newFormState)
    setAddOn('')
  }

  const changeAddOnHandler = (e) => {
    e.preventDefault();
    setAddOn(e.target.value)
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(e)
    }
  }

  const itemClasses = classNames("d-flex align-items-start col-12",
    { 'col-lg-6': !long }
  )

  const inputClasses = classNames('input-group',
    { 'w-100': long },
  )


  return (
    <>
      <FormField fieldName={fieldName} label={label} bottomSpacing={bottomSpacing}>
        <div className="listInput-container card p-3">
          {values?.length > 0 && <ul className='clear-list-properties mb-2 d-flex row g-0'>
            {values.map((val, idx) => {
              const deleteItemHandler = (e) => {
                e.preventDefault();
                let newFormState = { ...form.getState };
                let newValues = values.filter((val, i) => i !== idx)
                setValues(newValues)
                newFormState[fieldName] = newValues.join(",")
                form.setState(newFormState)

              }
              return (
                <li key={idx} className={itemClasses}>
                  {props?.disabled ? <i className="bi bi-dash" /> : <button onClick={deleteItemHandler} className='btn btn-transparent p-0'><i className="bi bi-x text-primary" /></button>}
                  <p className='pb-1 text-wrap w-100'>{val}
                  </p>
                </li>
              )
            })}
          </ul>}
          {!props.disabled && <div className={inputClasses}>
            <input
              className="form-control"
              type="text"
              autoFocus={autoFocus}
              autoComplete="off"
              name={`additional-${fieldName}`}
              placeholder={props.placeholder || `Add ${label}`}
              value={addOn}
              onKeyDown={handleInputKeyDown}
              onChange={changeAddOnHandler}
            />
            <button className="btn btn-primary input-group-append" type="button" disabled={!addOn} onClick={handleAdd}><i className="bi bi-plus" /></button>
          </div>}
          {!hide_upload && !props.disabled && (
            <div className="mt-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowImportModal(true);
                }}
                className="text-primary"
              >
                <i className="bi bi-upload me-1"></i>
                Import CSV
              </a>
            </div>
          )}
          <input
            type={type}
            {...props}
            {...ariaProps}
            autoComplete='off'
            autoFocus={autoFocus}
            value={props.value ?? form.getState[fieldName] ?? ''}
            onChange={onChange}
            className="d-none"
            onPaste={onPaste}
            name={fieldName}
            id={fieldName}
            ref={inputRef}
          />
        </div>
        {hasErrors && !hideErrorMessage ? (
          <FieldErrors
            id={`fieldError-${fieldName}`}
            errors={errors}
          />
        ) : null}
      </FormField>

      {/* Import CSV Modal */}
      <Modal.Overlay open={showImportModal} onClose={() => setShowImportModal(false)}>
        <Modal.Title title="Import CSV" />
        <Modal.Description>

          <div className="mb-3">
            <label htmlFor="csv-file-input" className="form-label">
              Select CSV File
            </label>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="form-control"
            />
            <div className="form-text">
              Upload a CSV file with comma-separated values. Each value will be added to the list.
            </div>
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="replace-mode-checkbox"
                checked={replaceMode}
                onChange={(e) => setReplaceMode(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="replace-mode-checkbox">
                Replace existing items
              </label>
            </div>
            <div className="form-text">
              {replaceMode
                ? "All existing items will be replaced with the imported data."
                : "Imported items will be added to the beginning of the existing list."}
              <p className='mt-1 mb-0 text-primary'>Remember to save after importing!</p>
            </div>
          </div>

          {csvError && (
            <div className="alert alert-danger" role="alert">
              {csvError}
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowImportModal(false);
                setCsvFile(null);
                setCsvError(null);
                setReplaceMode(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCsvImport}
              disabled={!csvFile}
            >
              Import
            </button>
          </div>

        </Modal.Description>
      </Modal.Overlay>
    </>
  );
};


export default ListInput;
