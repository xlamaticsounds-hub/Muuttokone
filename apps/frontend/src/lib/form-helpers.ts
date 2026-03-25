/**
 * Shared form result helpers for consistent error/success handling
 */

import { z } from 'zod';

// Small helper to convert FormData -> plain object without using Object.fromEntries
function formDataToObject(fd: FormData): Record<string, any> {
  const out: Record<string, any> = {};

  for (const [rawKey, rawValue] of fd.entries()) {
    const value = typeof rawValue === 'string' ? rawValue : rawValue;

    if (rawKey.endsWith('[]')) {
      const baseKey = rawKey.slice(0, -2);
      if (!Array.isArray(out[baseKey])) out[baseKey] = [];
      out[baseKey].push(value);
      continue;
    }

    if (rawKey.includes('.')) {
      const parts = rawKey.split('.');
      let current: Record<string, any> = out;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!current[p] || typeof current[p] !== 'object') current[p] = {};
        current = current[p];
      }
      current[parts[parts.length - 1]] = value;
      continue;
    }

    // boolean handling
    if (value === 'on' || value === 'true') {
      out[rawKey] = true;
    } else if (value === 'false') {
      out[rawKey] = false;
    } else {
      out[rawKey] = value;
    }
  }

  return out;
}

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
  for (const issue of result.error.issues) {
    if (issue.path.length > 0) {
      const fieldName = issue.path.join('.');
      fieldErrors[fieldName] = issue.message;
    }
  }

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action: (_data: TInput) => Promise<FormResult<TOutput>>,
  formData: FormData | unknown,
): Promise<FormResult<TOutput>> {
  try {
    // Convert FormData to object if needed
    let data: unknown;
    if (formData instanceof FormData) {
      // Convert FormData into a plain object with support for
      // nested fields (dot notation), array fields (key[]), and booleans.
      data = formDataToObject(formData);
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
