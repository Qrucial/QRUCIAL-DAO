import React, { useState, useEffect } from 'react'

function useFormValidation(formState) {
  const initialState = {}
  Object.keys(formState).forEach(key => initialState[key] = false)
  const [errors, setErrors] = useState(initialState)
  const [touched, setTouched] = useState(initialState)
  const [disabled, setDisabled] = useState(true)

  function validate(formState) {
    const entries = Object.entries(formState)
    const errors = {}
    for (const [key, value] of entries) {
      switch (key) {
        case 'url': {
          const parts = value.split('.');
          const extension = parts.length > 1 ? parts.pop().toLowerCase() : '';
          errors.url = extension === 'tar' ? false : true
          }
          break
        case 'hash':
          errors.hash = value.length === 64 ? false : true
          break
        default:
          break
      }
    }
    return errors
  }

  useEffect(() => {
    const errors = validate(formState)
    setDisabled(Object.values(errors).some(v => v))
    setErrors(errors)
  }, [formState])

  const handleBlur = field => e => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function showError(field) {
    const hasError = errors[field]
    const shouldShow = !!(touched[field] && formState[field])
    return hasError ? shouldShow : false
  }

  function ErrorLabel(props) {
    return showError(props.field) ? (
      < div className="ui pointing prompt label" role="alert" aria-atomic="true">
        {props.text}
      </div>
    ) : null
  }

  return {
    disabled,
    handleBlur,
    showError,
    ErrorLabel,
  }
}

export default useFormValidation
