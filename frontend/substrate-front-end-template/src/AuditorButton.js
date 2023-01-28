import React, { useEffect, useState } from 'react'
import { Form, Input, Message, Popup } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

export default function AuditorButton(props) {
  const { api } = useSubstrateState()
  const [status, setStatus] = useState(null)
  const [method, setMethod] = useState(null)
  const [profileHash, setProfileHash] = useState(null)

  useEffect(() => {
    if (api?.tx?.auditModule?.[props.method]) setMethod(props.method)
    else setMethod(null)
  }, [api, props.method])

  const metaArgs = api?.tx?.auditModule?.[method]?.meta.args
  const paramName = metaArgs?.[0].name.toString()
  const paramType = metaArgs?.[0].type.toString()

  const buttonSize = props.buttonSize ? props.buttonSize : 'medium'

  let message = null
  console.log("status", status)
  if (status && status.includes('Finalized')) message = <Message positive>{status}</Message>
  else if (status && status.includes('Failed')) message = <Message negative>{status}</Message>
  else if (status) message = <Message warning>{status}</Message>

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
                style={{ minWidth: '38em' }}
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

