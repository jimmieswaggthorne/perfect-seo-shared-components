"use client";

import React, { useEffect, useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { Validator } from '@/perfect-seo-shared-components/utils/validators';
import classNames from 'classnames';
import FormField from './FormField';
import useFormInput from '@/perfect-seo-shared-components/hooks/useFormInput';
import FieldErrors from './FieldErrors';
import '@/perfect-seo-shared-components/styles/components/HTMLEditor.scss';

interface HtmlEditorProps {
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
}

const HtmlEditor: React.FC<HtmlEditorProps> = ({
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
  placeholder = "<h1>Hello World</h1>",
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
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fieldName}.html`;
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
        if (model.getModeId() !== "html") return;

        // initial check
        const updateMarkers = () => {
          const text = model.getValue();
          const pos = text.indexOf("<script");
          if (pos !== -1) {
            monaco.editor.setModelMarkers(model, "html-lint", [
              {
                startLineNumber: text.substring(0, pos).split("\n").length,
                startColumn: 1,
                endLineNumber: text.substring(0, pos).split("\n").length,
                endColumn: 20,
                message: "Avoid <script> tags in this HTML",
                severity: monaco.MarkerSeverity.Warning,
              },
            ]);
          } else {
            monaco.editor.setModelMarkers(model, "html-lint", []);
          }
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
        <div className={classNames("htmlEditor-container", className, {
          "htmlEditor-container_withError": hasErrors,
        })}>
          <Editor
            height={height}
            defaultLanguage="html"
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
        {(showDownload || showUpload) && <div className="bg-light p-1 d-flex justify-content-center card align-items-end">
          <div className="htmlEditor-buttons">
            {showDownload && (
              <button
                type="button"
                className="btn btn-tiny btn-primary"
                onClick={handleDownload}
                title="Download HTML file"
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
                title="Upload HTML or TXT file"
              >
                <i className="bi bi-upload"></i>
                <span className="ms-1 d-none d-lg-inline">Upload</span>
              </button>
            )}
          </div>
        </div>}
        {showUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.txt"
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
export default HtmlEditor;