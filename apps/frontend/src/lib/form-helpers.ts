/**
 * Shared form result helpers for consistent error/success handling
 */

import { z } from 'zod';

// Generic form result type
export type FormResult<T = void> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Form submission state type
export type FormSubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message?: string }
  | { status: 'error'; error: string; fieldErrors?: Record<string, string> };

// Helper to create success result
export function createSuccessResult<T>(data?: T, message?: string): FormResult<T> {
  return {
    success: true,
    data,
    message,
  };
}

// Helper to create error result
export function createErrorResult<T = void>(
  error: string,
  fieldErrors?: Record<string, string>,
): FormResult<T> {
  return {
    success: false,
    error,
    fieldErrors,
  };
}

// Helper to validate form data with Zod schema
export function validateFormData<T>(schema: z.ZodSchema<T>, data: unknown): FormResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return createSuccessResult(result.data);
  }

  // Extract field-specific errors from Zod
  const fieldErrors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const fieldName = error.path.join('.');
    if (fieldName && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = error.message;
    }
  });

  return createErrorResult<T>('Lomakkeessa on virheitä. Tarkista syötetyt tiedot.', fieldErrors);
}

// Helper to format validation errors for display
export function formatValidationErrors(fieldErrors?: Record<string, string>): string {
  if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
    return 'Tuntematon virhe lomakkeen käsittelyssä.';
  }

  const errors = Object.entries(fieldErrors)
    .map(([field, message]) => `${field}: ${message}`)
    .join(', ');

  return `Virheet: ${errors}`;
}

// Generic form action wrapper
export async function safeFormAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  action: (_data: TInput) => Promise<FormResult<TOutput>>,
  formData: FormData | unknown,
): Promise<FormResult<TOutput>> {
  try {
    // Convert FormData to object if needed
    let data: unknown;
    if (formData instanceof FormData) {
      data = Object.fromEntries(formData.entries());

      // Handle checkboxes and multi-select fields
      const processedData: Record<string, any> = {};
      for (const [key, value] of formData.entries()) {
        if (key.endsWith('[]')) {
          // Multi-select field
          const baseKey = key.slice(0, -2);
          if (!processedData[baseKey]) {
            processedData[baseKey] = [];
          }
          processedData[baseKey].push(value);
        } else if (key.includes('.')) {
          // Nested field (e.g., "address.street")
          const parts = key.split('.');
          let current = processedData;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = value;
        } else {
          // Handle boolean fields
          if (value === 'on' || value === 'true') {
            processedData[key] = true;
          } else if (value === 'false') {
            processedData[key] = false;
          } else {
            processedData[key] = value;
          }
        }
      }
      data = processedData;
    } else {
      data = formData;
    }

    // Validate input data
    const validationResult = validateFormData(schema, data);
    if (!validationResult.success) {
      return createErrorResult<TOutput>(validationResult.error!, validationResult.fieldErrors);
    }

    // Execute the action
    return await action(validationResult.data!);
  } catch (error) {
    console.error('Form action error:', error);
    return createErrorResult<TOutput>(
      error instanceof Error ? error.message : 'Odottamaton virhe tapahtui',
    );
  }
}

// React hook for form state management
export function useFormSubmission() {
  const [state, setState] = React.useState<FormSubmissionState>({ status: 'idle' });

  const submit = async <T>(action: () => Promise<FormResult<T>>) => {
    setState({ status: 'submitting' });

    try {
      const result = await action();

      if (result.success) {
        setState({
          status: 'success',
          message: result.message || 'Lomake lähetetty onnistuneesti!',
        });
      } else {
        setState({
          status: 'error',
          error: result.error || 'Tuntematon virhe',
          fieldErrors: result.fieldErrors,
        });
      }
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Odottamaton virhe',
      });
    }
  };

  const reset = () => setState({ status: 'idle' });

  return { state, submit, reset };
}

// We need to import React for the hook
import React from 'react';
