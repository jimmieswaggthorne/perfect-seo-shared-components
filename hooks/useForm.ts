import { FormEvent, useEffect, useRef, useState } from 'react';
import type { Validator } from '@/perfect-seo-shared-components/utils/validators';
import { areArraysEqual } from '@/perfect-seo-shared-components/utils/global';

export type FormState = Record<string, any>;
type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface FieldConfig {
  ref: HTMLElement,
  required: boolean;
  validator?: Validator;
}

interface ValidationRules {
  requiredFields: string[];
  validatorFields: string[];
}

export interface FormController {
  getFieldErrors: (fieldName: string) => string[];
  getFormError: string;
  getFormSuccess: string;
  /**
   * Returns the current form state.
   */
  getState: FormState;
  setState: (state: Partial<FormState>) => void;
  setInitialState?: (state: Partial<FormState>) => void;
  handleInputChange: (e: FormEvent<FormElement>) => void;
  register: (fieldName: string, config: FieldConfig) => void,
  setFormError: (error: string) => void;
  setFormSuccess: (success: string) => void;
  unregister: (fieldName: string) => void,
  getChangeStatus?: () => boolean
  setFieldErrors?: (key: string, error: string) => void;
  fieldErrors?: Record<string, string[]>,
  setErrors?: (errors: Record<string, string[]>) => void;
  /**
   * Runs all field validators and checks required fields,
   * focusing the first of any erroneous inputs, and returns
   * true or false depending on whether the form is valid.
   */
  validate: (rules?: ValidationRules, error?: string[]) => boolean;
  resetFieldErrors: (fieldName: string) => void,
}

/**
 * Provides a set of imperative form controls for use
 * in tandem with a Form component.
 *
 * @example
 *
 *  const form = useForm();
 * 
 *  ...
 * 
 *  <Form controller={form}>
 *    ...
 *  </Form>
 */


export default function useForm(initialData?: FormState): FormController {
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [formState, setFormState] = useState<FormState>(initialData || {});
  const [initialState, setInitialState] = useState<FormState>({});
  const [changed, setChanged] = useState(false);
  const { current: fieldConfigs } = useRef<Record<string, FieldConfig>>({});

  useEffect(() => {
    let initialData = JSON.stringify(initialState);
    let currentData = JSON.stringify(formState);

    setChanged(initialData !== currentData);
  }, [formState]);

  function requiredFails(fieldName: string, value: any = formState[fieldName]) {

    if (fieldName === undefined) {
      return false;
    }

    const { required } = fieldConfigs[fieldName];

    return (required && !value && value !== 0);
  }

  function validatorFails(fieldName: string, value: any = formState[fieldName]) {
    const { validator } = fieldConfigs[fieldName];

    return (value && validator && !validator.test(value, formState));
  }

  function getFieldErrors(fieldName: string, currentFormState: FormState): string[] {
    const { validator } = fieldConfigs[fieldName];
    const value = currentFormState[fieldName];

    if (requiredFails(fieldName, value)) {
      return ['This field is required.'];
    } else if (validatorFails(fieldName, value) && validator) {
      return [validator.message];
    }

    return [];
  }

  function getChangeStatus(): boolean {
    return changed;
  }

  const setFieldErrors = (key, error) => {
    let newErrors = { ...formErrors };

    newErrors[key] = [error];
    setFormErrors(newErrors);

  };

  return {
    getFieldErrors: fieldName => formErrors[fieldName],
    getChangeStatus: () => getChangeStatus(),
    getFormError: formError,
    getFormSuccess: formSuccess,
    getState: formState,
    setErrors: (state: Record<string, string[]>) => { setFormErrors(state); },
    fieldErrors: formErrors,
    setState: state => { setFormState(state); },
    setFieldErrors,
    setInitialState: state => {
      setFormState({ ...state });
      setInitialState({ ...state });
      setChanged(false);
    },
    handleInputChange: e => {
      const target = e.target as FormElement;
      const fieldName = target.name || target.id;

      // Update form state and get the value based on input type
      let value;

      if (target.type === 'checkbox') {
        value = (target as HTMLInputElement).checked === true;
      } else {
        value = target.value;
      }

      const updatedFormState = {
        ...formState,
        [fieldName]: value,
      };

      setFormState(updatedFormState);

      // Allow erroneous inputs to be re-validated on change
      const { required, validator } = fieldConfigs[fieldName];
      const fieldUsesValidation = required || validator;
      const currentFieldErrors = formErrors[fieldName] || [];

      if (fieldUsesValidation && currentFieldErrors.length > 0) {
        const updatedFieldErrors = getFieldErrors(fieldName, updatedFormState);

        if (!areArraysEqual(updatedFieldErrors, currentFieldErrors)) {
          setFormErrors({
            ...formErrors,
            [fieldName]: updatedFieldErrors,
          });
        }
      }
    },
    register: (fieldName, config) => {
      fieldConfigs[fieldName] = config;
    },
    setFormError: error => setFormError(error),
    setFormSuccess: success => setFormSuccess(success),
    unregister: fieldName => delete fieldConfigs[fieldName],
    validate: (rules?: ValidationRules, failure?: string[]) => {
      // Re-evaluate and store field-level errors
      const errors = {};
      const requiredFields = rules ? (rules.requiredFields || []) : Object.keys(fieldConfigs);
      const validators = rules ? (rules.validatorFields || []) : Object.keys(fieldConfigs);

      if (failure) {
        errors[failure[0]] = [failure[1]];
      }

      requiredFields.forEach((fieldName) => {
        if (requiredFails(fieldName)) {
          errors[fieldName] = ['This field is required.'];
        }
      });

      validators.forEach((fieldName) => {
        const { validator } = fieldConfigs[fieldName];

        if (validatorFails(fieldName) && validator) {
          errors[fieldName] = [validator.message];
        }
      });

      setFormErrors(errors);

      // Drive focus to the first erroneous input, if there is one
      //
      // TODO: The order of field configs may not reflect the display
      // order of form elements if any are dynamically rendered in
      // and out. We'll need to use a querySelector on the root form
      // element to find the first input, and focus that.
      const firstErrorFieldName = Object.keys(errors)[0];
      const firstErrorInput = fieldConfigs[firstErrorFieldName]?.ref;

      firstErrorInput?.focus();

      return Object.keys(errors).length === 0;
    },
    resetFieldErrors: fieldName => {
      let fieldErrors = formErrors;

      formErrors[fieldName] = [];
      setFormErrors(fieldErrors);
    },
  };
}
