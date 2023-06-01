import React, { useState, useEffect, useRef } from 'react'
import { Grid, Segment, Header } from 'semantic-ui-react'
import { useSubstrateState } from './substrate-lib'
import RequestAudit from './RequestAudit'
import AuditList from './AuditList'

export default function Requestor(props) {

    const { currentAccount } = useSubstrateState()

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
  
    useEffect(()=>{
        setAuditsChange(currentAccount?.address)
      },[currentAccount])

      const myAudits = auditData.filter(a => a.requestor === currentAccount.address)

  return (
    <Grid.Column>
      <Segment>
        <Header as='h3' color='blue'>My requests</Header>
        <AuditList 
              auditData={myAudits}
              auditsChange={auditsChange}
              />
      </Segment>
      <RequestAudit changeList={changeList}/>
    </Grid.Column>
  )
}
