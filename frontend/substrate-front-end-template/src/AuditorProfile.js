import React, { useState, useEffect } from 'react'
import { Grid, Segment, Header, Table, Button } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import AuditorForm from './AuditorForm.js'
import CancelAccount from './CancelAccount'

export default function AuditorProfile(props) {
  const { currentAccount } = useSubstrateState()
  const auditorData = props.auditorData 
  const details = props.details
  const score = details && details.score || '-'
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setEditing(false)
 }, [currentAccount])

  function AuditorTable(props) {
    let rows
    if (!auditorData) rows = (
      <Table.Row>
       <Table.Cell>Please update your profile!</Table.Cell> 
      </Table.Row>
    )
    else rows = Object.entries(auditorData).map(([key, value]) => (
      <Table.Row key={key}>
        <Table.Cell>{key}</Table.Cell>
        <Table.Cell style={{ wordBreak: 'break-word' }}>
          {value || '-'}
        </Table.Cell>
      </Table.Row>
    ))
    return (
      <Table definition>  
        <Table.Body>
          {rows}
        </Table.Body>
      </Table>
    )
  }

  return (
    <Grid.Column>
      <Header as='h3' >Auditor Profile</Header> 
      <Segment /* style={{background: '#f7f7f7'}} */>
        {details
          ? <div> 
              <Header as='h4'>
                Current score: <span className='blue'>{score}</span>
              </Header> 
              {editing === false && 
                <div>
                  <AuditorTable auditorData={auditorData} />
                  <div style={{ textAlign: 'right' }}>
                    <Button color='blue' onClick={()=> setEditing(true)}>
                      Edit profile
                    </Button> 
                  </div>
                </div>
              }  
              {editing && 
                <AuditorForm 
                  method='updateProfile' 
                  auditorData={auditorData} 
                  details={details}
                  finishEvent={() => setEditing(false)}
                />
              }
              <br/>
              <CancelAccount auditorData={auditorData} />
            </div>
          : <div> 
              <p>For auditors only. </p>
            </div>
        } 
      </Segment>
    </Grid.Column>
  )
}
