import React,  { useEffect, useState } from 'react'
import { Grid, Segment, Header } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import AuditorButton from './AuditorButton.js'
import CancelAccount from './CancelAccount'

export default function AuditorProfile(props) {
  const { api, currentAccount } = useSubstrateState()
  const [details, setDetails] = useState(null)
  const [cancelStatus, setCancelStatus] = useState(null)

  useEffect(() => {
    setCancelStatus(null); 
  }, [currentAccount]);

  const queryResHandler = result =>
    result.isNone ? setDetails(null) : setDetails(result.toString())

  useEffect(() => {
    let unsub = null
    const query = async () => {
      const params = [currentAccount?.address]
      unsub = await api.query.auditModule.auditorMap(
        ...params,
        queryResHandler
      )
    }
    if (api?.query?.auditModule?.auditorMap && currentAccount) {
      query()
    } 
    return () => unsub && unsub()
  }, [api, currentAccount])

  const score = details && JSON.parse(details).score || '-'

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
              <CancelAccount status={cancelStatus} setStatus={setCancelStatus} />
            </div>
          : <div> 
              <p>For auditors only. </p>
              {cancelStatus &&
                <div>
                  <p>Account deleted</p>
                  {cancelStatus}
                </div>
              }
            </div>
        } 
      </Segment>
    </Grid.Column>
  )
}
