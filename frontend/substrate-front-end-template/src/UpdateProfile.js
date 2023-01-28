import React from 'react'
import { Grid, Segment, Header } from 'semantic-ui-react'

import AuditorButton from './AuditorButton.js'

export default function UpdateProfile(props) {
  return (
    <Grid.Column>
      <Header as='h3'>Auditor Profile</Header>   
      <Segment style={{background: '#f7f7f7'}}>  
        <p>To update, provide hash and press the button.</p>
        <AuditorButton method='updateProfile' buttonSize='small' />
      </Segment>
    </Grid.Column>
  )
}
