import { SubmissionError, startAsyncValidation, stopAsyncValidation } from 'redux-form';

// redux form submit promise wrapper
// - turns all errors into SubmissionError
// - fills _error field, enables showing main error message in form
// - includes superlogin's validationErrors
export function formPromiseWrapper(promise) {
  return new Promise((resolve, reject) => {
    promise
      .then(resolve)
      .catch(error => {
        // axius (used by superlogin http utils) puts response data in response.data
        if (error.response && error.response.data) {
          error = error.response.data;
        }

        // promise middleware puts actual error in reason
        if (error.action && error.reason) {
          error = error.reason;
        }
        const submissionErrors = {
          _error: error.message || error.error
        };
        // add superlogin validation errors
        // joined because superlogin creates arrays per field
        for (const prop in error.validationErrors) {
          submissionErrors[prop] = error.validationErrors[prop].join(', ');
        }
        const submissionError = new SubmissionError(submissionErrors);

        reject(submissionError);
      });
  });
}

export function classNames(...names) {
  return names
    .filter(name => typeof name === 'string')
    .join(' ');
}

export function asyncValidateForm(dispatch, form, asyncValidate, formData) {
  dispatch(startAsyncValidation(form));
  asyncValidate(formData).then(() => {
    dispatch(stopAsyncValidation(form));
  }).catch(error => {
    dispatch(stopAsyncValidation(form, error));
  });
}
