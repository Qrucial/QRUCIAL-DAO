import React,  { useState } from 'react'
import { Grid, Segment, Header, Form, Input } from 'semantic-ui-react'

import { TxButton } from './substrate-lib/components'
import { createToast } from './toastContent'

export default function RequestAudit(props) {
  const [formState, setFormState] = useState({ url: '', hash: '', stake: 0 })
  const { url, hash, stake } = formState

  const onChange = (_, data) =>
    setFormState(prev => ({ ...prev, [data.label]: data.value }))

  return (
    <Grid.Column>
      <Segment>
        <Header as='h2' textAlign='center'>
          Request your <span className='blue'>on-chain </span>audit
        </Header> 
         <div> 
          <Form>
            <Form.Field>
              <Input
                placeholder='url'
                type='text'
                label='url'
                value={url}
                onChange={onChange}
              />
            </Form.Field>
            <Form.Field>
              <Input
                placeholder='H256'
                type='text'
                label='hash'
                value={hash}
                onChange={onChange}
              />
            </Form.Field>
            <Form.Field>
              <Input
                type='number'
                label='stake'
                value={stake}
                onChange={onChange}
              />
            </Form.Field>
            <Form.Field style={{ textAlign: 'center' }}>
              <TxButton 
                label='Submit'
                type='SIGNED-TX' 
                color='blue' 
                setStatus={createToast()}
                txOnClickHandler={() => setFormState({ url: '', hash: '', stake: 0 })}
                attrs={{
                  palletRpc: 'exoSys',
                  callable: 'toolExecReq',
                  inputParams: [url, hash, stake],
                  paramFields: [
                    { name: 'url' },
                    { name: 'hash' },
                    { name: 'stake' },
                  ],
                }} 
              /> 
            </Form.Field>
          </Form>
        </div>
      </Segment>
    </Grid.Column>
  )
}
