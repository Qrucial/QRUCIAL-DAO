import React, { useEffect, useState } from 'react'
import { Form, Input, Message, Popup } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

export default function AuditorButton(props) {
  const { api, currentAccount } = useSubstrateState()
  const [status, setStatus] = useState(null)
  const [method, setMethod] = useState(null)
  const [profileHash, setProfileHash] = useState(null)
  
  useEffect(() => {
    setStatus(null); 
  }, [currentAccount]);

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

  let message = null
  if (status && status.includes('Finalized')) 
    message = <Message positive style={{ marginBottom: '1em' }}>{status}</Message>
  else if (status && status.includes('Failed')) 
    message = <Message negative style={{ marginBottom: '1em' }}>{status}</Message>
  else if (status) 
    message = <Message warning style={{ marginBottom: '1em' }}>{status}</Message>

  let buttonLabel
  if (props.method === 'signUp') buttonLabel = 'Sign Up'
  else if (props.method === 'updateProfile') buttonLabel = 'Update Profile'

  return (  
    <div>
      <Form>
        <Form.Group inline>
          <Form.Field>
            <Popup content='Generate your profile hash from relevant profile data'
              trigger={
              <Input
                placeholder={paramType}
                type="text"
                label={paramName}
                value={profileHash ? profileHash : ''}
                onChange={(_, { value }) => setProfileHash(value)}
              />
            }/>  
          </Form.Field>
          <Form.Field>
            <TxButton 
              label={buttonLabel}
              type='SIGNED-TX' 
              color='blue' 
              disabled={disabled}
              size={buttonSize}
              setStatus={setStatus}
              attrs={{
                palletRpc: 'auditModule',
                callable: method,
                inputParams: [profileHash],
                paramFields: [{ name: paramName, type: paramType }],
              }} 
            />          
          </Form.Field>
        </Form.Group>
      </Form>
      {message}
    </div> 
  )
}

