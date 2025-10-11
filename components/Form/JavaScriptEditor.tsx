"use client";

import React, { useEffect, useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { Validator } from '@/perfect-seo-shared-components/utils/validators';
import classNames from 'classnames';
import FormField from './FormField';
import useFormInput from '@/perfect-seo-shared-components/hooks/useFormInput';
import FieldErrors from './FieldErrors';
import '@/perfect-seo-shared-components/styles/components/JavaScriptEditor.scss';

interface JavaScriptEditorProps {
  fieldName: string;
  error?: string;
  label?: string | any;
  validator?: Validator;
  className?: string;
  hideErrorMessage?: boolean;
  bottomSpacing?: boolean;
  onChange?: (value: string | undefined) => void;
  hint?: string;
  required?: boolean;
  height?: string;
  value?: string;
  showUpload?: boolean;
  showDownload?: boolean;
  placeholder?: string;
  button?: any;
}

const JavaScriptEditor: React.FC<JavaScriptEditorProps> = ({
  fieldName,
  error,
  label,
  validator,
  className,
  hideErrorMessage,
  bottomSpacing = true,
  onChange,
  hint,
  required,
  height = "350px",
  value,
  showUpload = true,
  showDownload = true,
  button,
  placeholder = '// Your JavaScript code here\nfunction example() {\n  return "Hello from JavaScript";\n}',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { errors, hasErrors, form, inputRef } = useFormInput({
    fieldName,
    error,
    required,
    validator,
  });

  // Get current value from form state or use provided value or default
  const currentValue = value || form.getState[fieldName] || "";

  const ariaProps = {
    'aria-invalid': hasErrors,
    'aria-describedby': hasErrors ? `fieldError-${fieldName}` : undefined,
    'aria-required': !!required,
  };

  function handleChange(newValue: string | undefined) {
    // Create a synthetic event to work with the form's handleInputChange
    const syntheticEvent = {
      target: {
        name: fieldName,
        value: newValue || '',
      },
    } as React.ChangeEvent<HTMLInputElement>;

    form.handleInputChange(syntheticEvent);

    if (onChange) {
      onChange(newValue);
    }
  }

  // Download functionality
  const handleDownload = () => {
    const content = currentValue || '';
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fieldName}.js`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Upload functionality
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const syntheticEvent = {
        target: {
          name: fieldName,
          value: content,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      form.handleInputChange(syntheticEvent);

      if (onChange) {
        onChange(content);
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  // set up linting once monaco is loaded
  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.editor.onDidCreateModel((model: any) => {
        if (model.getModeId() !== "javascript") return;

        // initial check
        const updateMarkers = () => {
          const text = model.getValue();
          const markers = [];

          // Check for potentially dangerous patterns
          const dangerousPatterns = [
            { pattern: /eval\s*\(/, message: "Consider avoiding eval() for security reasons" },
            { pattern: /document\.write\s*\(/, message: "Consider using modern DOM methods instead of document.write" },
            { pattern: /innerHTML\s*=/, message: "Consider using textContent or safer DOM methods" }
          ];

          dangerousPatterns.forEach(({ pattern, message }) => {
            const match = text.match(pattern);
            if (match) {
              const pos = text.indexOf(match[0]);
              const lines = text.substring(0, pos).split('\n');
              markers.push({
                startLineNumber: lines.length,
                startColumn: lines[lines.length - 1].length + 1,
                endLineNumber: lines.length,
                endColumn: lines[lines.length - 1].length + match[0].length + 1,
                message,
                severity: monaco.MarkerSeverity.Warning,
              });
            }
          });

          monaco.editor.setModelMarkers(model, "javascript-lint", markers);
        };

        updateMarkers();
        model.onDidChangeContent(updateMarkers);
      });
    });
  }, []);

  return (
    <FormField hint={hint} fieldName={fieldName} bottomSpacing={bottomSpacing}>
      <div className="d-flex flex-column">
        <div>
          {label && <label className="formField-label mb-0">{label}</label>}
          {hint && <p className="formField-hint text-wrap">{hint}</p>}
        </div>
        <div className={classNames("javascriptEditor-container", className, {
          "javascriptEditor-container_withError": hasErrors,
        })}>
          <Editor
            height={height}
            defaultLanguage="javascript"
            value={currentValue || placeholder}
            onChange={handleChange}
            options={{
              minimap: { enabled: false },
              wordWrap: "on",
              ...ariaProps,
            }}
            onMount={(editor, monaco) => {
              if (!currentValue && placeholder) {
                // Set placeholder styling when editor is empty
                editor.updateOptions({
                  readOnly: false,
                  formatOnPaste: true,
                  formatOnType: true,
                  tabSize: 2,
                  insertSpaces: true,
                });

                // When editor gains focus and contains placeholder, clear it
                editor.onDidFocusEditorText(() => {
                  if (editor.getValue() === placeholder) {
                    editor.setValue('');
                  }
                });

                // When editor loses focus and is empty, restore placeholder
                editor.onDidBlurEditorText(() => {
                  if (!editor.getValue().trim()) {
                    editor.setValue(placeholder);
                  }
                });
              }
              editor.onDidBlurEditorText(() => {
                editor.getAction('editor.action.formatDocument').run();
              })
            }}
          />
        </div>
        {(showDownload || showUpload || button) && <div className="bg-light p-1 d-flex justify-content-center card align-items-end">
          <div className="javascriptEditor-buttons">
            {showDownload && (
              <button
                type="button"
                className="btn btn-tiny btn-primary"
                onClick={handleDownload}
                title="Download JavaScript file"
              >
                <i className="bi bi-download"></i>
                <span className="ml-1 d-none d-lg-inline">Download</span>
              </button>
            )}
            {showUpload && (
              <button
                type="button"
                className="btn btn-tiny btn-primary"
                onClick={triggerFileUpload}
                title="Upload JavaScript or TXT file"
              >
                <i className="bi bi-upload"></i>
                <span className="ms-1 d-none d-lg-inline">Upload</span>
              </button>
            )}
            {button && <>{button}</>}
          </div>
        </div>}
        {showUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".js,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        )}
        {hasErrors && !hideErrorMessage ? (
          <FieldErrors
            id={`fieldError-${fieldName}`}
            errors={errors}
          />
        ) : null}
      </div>
    </FormField>
  );
};
export default JavaScriptEditor;