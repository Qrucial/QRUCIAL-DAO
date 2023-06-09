import React, { useState, useEffect, useRef } from 'react'
import { Grid, Header, Segment } from 'semantic-ui-react'

import RequestAudit from './RequestAudit'
import { BalanceAnnotation } from './AccountSelector'
import AuditorPool from './AuditorPool'
import AuditList from './AuditList'

export default function Home(props) {  
  const [auditData, setAuditData] = useState([])
  const [auditsChange, setAuditsChange] = useState('')
  const changeList = (latest) => setAuditsChange(latest)

  const getData=()=>{
    fetch('/lar/audit-requests', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      if (!response.ok) {
        throw Error(response.status + ' ' + response.statusText)
      }
      return response.json()
    }
    ).then(data =>{
      setAuditData(data)
    }).catch((err) => {
      console.log(err.message)
    })
  }

  const initialRender = useRef(true);
  useEffect(()=>{
    if (initialRender.current) {
      getData()
      initialRender.current = false;
    } else {
      setTimeout(() => {
        getData()
      }, 1000)
    }
  },[auditsChange])

  return (
    <Grid centered>
      <Grid.Row>
        <Grid.Column>
          <RequestAudit changeList={changeList}/>
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Segment>
          <Header as='h3' style={{fontWeight: 'normal'}}>
            Balance: <BalanceAnnotation />
          </Header>
        </Segment>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column width={10}>
          <Header as='h3' style={{fontWeight: 'normal'}}>
            Auditor pool
          </Header>
          <Segment>
            <AuditorPool />
          </Segment>
        </Grid.Column>
        <Grid.Column width={6}>
          <Header as='h3' style={{fontWeight: 'normal'}}>
            Latest audits
          </Header>
          <Segment className='latestAudits' style={{paddingRight: '0'}}>
            <AuditList auditData={auditData}  auditsChange={auditsChange}/>
          </Segment>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
}

