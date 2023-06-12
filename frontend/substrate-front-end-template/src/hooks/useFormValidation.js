import React, { useState, useEffect } from 'react'

function useFormValidation(origFormState, setDisabledState) {
  let formState = {}
  if (Array.isArray(origFormState)) {
    const newArray = origFormState.map((elem) => Object.assign({}, elem))
    newArray.forEach((elem, i) => {
      Object.keys(elem).forEach(key => {
        delete Object.assign(elem, {[key + i]: elem[key] })[key] 
      })
      Object.assign(formState, elem)
    })
  } else formState = origFormState

  const initialState = {}
  Object.keys(formState).forEach(key => initialState[key] = false)
  const [errors, setErrors] = useState(initialState)
  const [touched, setTouched] = useState(initialState)
  const [disabled, setDisabled] = useState(true)

  function allowedChars(str) {
    if (str === '') return true
    else if (!str) return false
    const regex = /^[A-Za-z0-9\s-:.,/?_&#=]*$/
    return regex.test(str)
  }

  const isValidUrl = (urlString) => {
    const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
    return !!urlPattern.test(urlString);
  }

  function validate(formState) {
    const entries = Object.entries(formState)
    const errors = {}
    for (const [key, value] of entries) {
      switch (key) {
        case 'url':
        case 'reportUrl':
        case 'webUrl': 
        case 'picUrl':
          errors[key] = isValidUrl(value) ? false : true
          break
        case 'hash':
          errors.hash = value.length > 63 ? false : true
          break
        default:
          errors[key] = allowedChars(value) ? false : true
          break
      }
    }
    return errors
  }

  useEffect(() => {
    const errors = validate(formState)
    const isDisabled = Object.values(errors).some(v => v)
    setDisabled(isDisabled)
    setDisabledState && setDisabledState(isDisabled)
    setErrors(errors)
  }, [origFormState])

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
