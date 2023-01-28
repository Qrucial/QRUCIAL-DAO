import React from 'react'
import { Grid, Segment, Header } from 'semantic-ui-react'

import AuditorButton from './AuditorButton.js'

export default function Signup(props) {
  return (
    <Grid.Column>
      <Segment>
        <Header as='h2' color='blue'>Sign up to be an auditor</Header>   
        <p>Would you like to be an auditor? Create a profile hash, sign up here and wait for approval. 
          You can select your account to sign with in the account selector in the top right corner of the page.</p>
        <AuditorButton method='signUp' />
      </Segment>
    </Grid.Column>
  )
}
