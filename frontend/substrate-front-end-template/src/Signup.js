import React from 'react'
import { Grid, Segment, Header } from 'semantic-ui-react'

import AuditorForm from './AuditorForm.js'

export default function Signup(props) {

const auditorFields = { name:'', picUrl: '', webUrl: '', bio: '', address: props.address }

  return (
    <Grid.Column>
      <Segment>
        <Header as='h3' color='blue'>Sign up to be an auditor</Header>   
        <p>Would you like to be an auditor? Sign up here and wait for approval. 
          You can select your account to sign with in the account selector in the bottom right corner of the page.</p>
        <AuditorForm method='signUp' auditorData={auditorFields}/>        
      </Segment>
    </Grid.Column>
  )
}
