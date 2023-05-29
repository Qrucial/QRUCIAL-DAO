import React, { useState } from 'react'
import { Form, Input, Button, Divider } from 'semantic-ui-react'
import { keccak_512 } from 'js-sha3'
import toast from 'react-hot-toast'

import useTxAndPost from './hooks/useTxAndPost'
import { useSubstrateState } from './substrate-lib'
import useFormValidation from './hooks/useFormValidation'

export default function AuditorForm(props) {
  const { currentAccount } = useSubstrateState()
  const auditorData = props.auditorData
  const auditorFields = auditorData ? {...auditorData} : { name:'', picUrl: '', webUrl: '', bio: '', address: currentAccount?.address }
  delete auditorFields.profileHash
  const [formState, setFormState] = useState(auditorFields) 
  const [disabled, setDisabled] = useState(false) 

  const postAttrs = { postUrl: '/profile_update' }
  const txAttrs = { palletRpc: 'auditModule', callable: props.method, finishEvent: props.finishEvent }

  const { txAndPost } = useTxAndPost(txAttrs, postAttrs)

  const onClick = async (event, data) => {
    if (formState.address != currentAccount?.address) {
      toast.error('No permission with this account')
      return
    }    
    const inputParams = {...formState}
    const profileHash = keccak_512(JSON.stringify(inputParams))
    const profileData = Object.assign({}, inputParams, { profileHash });
 
    txAndPost([profileHash], profileData)
  }
  
  const onChange = (target) => { 
    setFormState(prev => ({ ...prev, [target.name]: target.value }))
  }

  let buttonLabel
  if (props.method === 'signUp') buttonLabel = 'Sign Up'
  else if (props.method === 'updateProfile') buttonLabel = 'Update Profile'

  return (  
    <div>
      <Form>
        <FieldsFromList 
          auditorFields={auditorFields} 
          onChange={onChange} 
          state={formState}
          setDisabled={setDisabled}/>
        <Form.Field style={{ textAlign: 'right' }}>  
          { props.method === 'updateProfile' &&
            <Button 
              color='blue' 
              type="submit"
              onClick={() => props.finishEvent()}
              >
              Cancel
            </Button> 
          }
          <Button 
            color='blue' 
            type="submit"
            disabled={disabled}
            onClick={onClick}
            >
            {buttonLabel}
          </Button>              
        </Form.Field>
        <Divider hidden />
      </Form>
    </div> 
  )
}

function FieldsFromList(props) {
  function onFieldChange(event) {
    props.onChange(event.target);
  }
  
  const {
    handleBlur,
    showError,
    ErrorLabel,
  } = useFormValidation(props.state, props.setDisabled)

  const fields = Object.entries(props.auditorFields).map(([key, value]) => {
    const nonModFields = ['address', 'profileHash', 'auditsDone']
    if (nonModFields.includes(key)) return null
    else return (
      <Form.Field key={key} error={showError(key)}>
        <Input
          placeholder={value}
          type="text"
          label={key}
          name={key}
          value={props.state[key]}
          onChange={onFieldChange}
          onBlur={handleBlur(key)}         
        />
        <ErrorLabel field={key} text='Some special characters are not allowed'/>
      </Form.Field>
    )
  })
  return <>{fields}</>
}
