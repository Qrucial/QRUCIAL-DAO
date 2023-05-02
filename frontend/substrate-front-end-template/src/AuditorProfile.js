import React from 'react'
import { Grid, Segment, Header } from 'semantic-ui-react'

import AuditorButton from './AuditorButton.js'
import CancelAccount from './CancelAccount'
import { createToast } from './toastContent'

export default function AuditorProfile(props) {
  const details = props.details  
  const score = details && details.score || '-'

  return (
    <Grid.Column>
      <Header as='h3' >Auditor Profile</Header> 
      <Segment style={{background: '#f7f7f7'}}>
        {details
          ? <div> 
              <Header as='h4'>
                Current score: <span className='blue'>{score}</span>
              </Header> 
              <p>To update, provide hash and press the button.</p>
              <AuditorButton method='updateProfile' buttonSize='small' />
              <br/>
              <CancelAccount setStatus={createToast()} />
            </div>
          : <div> 
              <p>For auditors only. </p>
            </div>
        } 
      </Segment>
    </Grid.Column>
  )
}
