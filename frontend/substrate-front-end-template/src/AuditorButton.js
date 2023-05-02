import React, { useEffect, useState } from 'react'
import { Form, Input, Popup } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import { TxButton } from './substrate-lib/components'
import { createToast } from './toastContent'

export default function AuditorButton(props) {
  const { api } = useSubstrateState()
  const [method, setMethod] = useState(null)
  const [profileHash, setProfileHash] = useState('')

  useEffect(() => {
    if (api?.tx?.auditModule?.[props.method]) setMethod(props.method)
    else setMethod(null)
  }, [api, props.method])

  function checkIfValidSHA256(str) {
    const bites = new TextEncoder().encode(str).length
    return bites >= 32;
  }

  const [disabled, setDisabled] = useState(null)
  useEffect(() => {
    const res = checkIfValidSHA256(profileHash) ? undefined : true
    setDisabled(res) 
  }, [profileHash]);

  const metaArgs = api?.tx?.auditModule?.[method]?.meta.args
  const paramName = metaArgs?.[0].name.toString()
  const paramType = metaArgs?.[0].type.toString()

  const buttonSize = props.buttonSize ? props.buttonSize : 'medium'
  
  let buttonLabel
  if (props.method === 'signUp') buttonLabel = 'Sign Up'
  else if (props.method === 'updateProfile') buttonLabel = 'Update Profile'

  return (  
    <div>
      <Form>
        <Form.Field>
          <Popup content='Generate your profile hash from relevant profile data'
            trigger={
            <Input
              placeholder={paramType}
              type="text"
              label={paramName}
              value={profileHash}
              onChange={(_, { value }) => setProfileHash(value)}
            />
          }/>  
        </Form.Field>
        <Form.Field style={{ textAlign: 'center' }}>
          <TxButton 
            label={buttonLabel}
            type='SIGNED-TX' 
            color='blue' 
            disabled={disabled}
            size={buttonSize}
            setStatus={createToast()}
            txOnClickHandler={() => setProfileHash('')}
            attrs={{
              palletRpc: 'auditModule',
              callable: method,
              inputParams: [profileHash],
              paramFields: [{ name: paramName, type: paramType }],
            }} 
          />          
        </Form.Field>
      </Form>
    </div> 
  )
}

