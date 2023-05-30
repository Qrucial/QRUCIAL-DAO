import React,  { useState } from 'react'
import { Grid, Segment, Header, Form, Input, Popup, Button } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import useTxAndPost from './hooks/useTxAndPost'
import useFormValidation from './hooks/useFormValidation'

const DEFAULT_STAKE = 500

export default function RequestAudit(props) {
  const [formState, setFormState] = useState({ url: '', hash: '', bounty: DEFAULT_STAKE, minAuditorScore: DEFAULT_STAKE })
  const { url, hash, bounty, minAuditorScore } = formState
  const { currentAccount } = useSubstrateState()

  const requestor = currentAccount?.address
  const finishEvent = () => { 
    props.changeList(url)
    setFormState({ url: '', hash: '', bounty: DEFAULT_STAKE, minAuditorScore: DEFAULT_STAKE })
  }

  const postAttrs = { postUrl: '/request-audit' }
  const txAttrs = { palletRpc: 'exoSys', callable: 'requestReview', finishEvent }
  const { txAndPost } = useTxAndPost(txAttrs, postAttrs)

  const onClick = async (event, data) => {
    const txData = [url, hash, bounty, minAuditorScore]
    const postData = { requestor, hash, projectUrl: formState.url };
    txAndPost(txData, postData)
  }

  const onChange = (_, data) => { 
    setFormState(prev => ({ ...prev, [data.label]: data.value }))
  }

  const {
    disabled,
    handleBlur,
    showError,
    ErrorLabel,
  } = useFormValidation(formState)

  return (
    <Grid.Column>
      <Segment>
        <Header as='h3' style={{fontWeight: 'normal'}} textAlign='center'>
          Request your <span className='blue'>on-chain </span>audit
        </Header> 
         <div> 
          <Form>
            <Form.Field error={showError('url')}>
              <Input
                placeholder='url of a tar file'
                type='text'
                label='url'
                value={url}
                onChange={onChange}
                onBlur={handleBlur('url')}
              />
              <ErrorLabel field='url' text='Needs to be a url of a .tar file'/>
            </Form.Field>
            <Form.Field error={showError('hash')}>
              <Input
                placeholder='Keccak-256'
                type='text'
                label='hash'
                value={hash}
                onChange={onChange}
                onBlur={handleBlur('hash')}
                icon={ 
                  <Popup content='Keccak-256 hash of the file, click the icon for online converter'
                    trigger={
                    <i onClick={(() => 
                      window.open('http://emn178.github.io/online-tools/keccak_256_checksum.html'))}
                      className="question circle outline circular link icon">
                    </i>
                  }/>
                }
              />
              <ErrorLabel field='hash' text='Needs to be a keccak-256 hash (256 bits)'/>
            </Form.Field>
            <Form.Field style={{ textAlign: 'center' }}>
              <Button 
                primary
                type="submit"
                onClick={onClick}
                disabled={disabled}
              >
                Submit
              </Button>
            </Form.Field>
          </Form>
        </div>
      </Segment>
    </Grid.Column>
  )
}
