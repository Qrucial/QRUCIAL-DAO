import React, { useState, useEffect, useRef } from 'react'
import { Grid, Segment, Header } from 'semantic-ui-react'
import { useSubstrateState } from './substrate-lib'
import { BalanceAnnotation } from './AccountSelector'
import RequestAudit, { DEFAULT_STAKE } from './RequestAudit'
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
  
    useEffect(()=>{
        setAuditsChange(currentAccount?.address)
      },[currentAccount])

      const myAudits = auditData.filter(a => a.requestor === currentAccount.address)

  return (
    <Grid.Column>
      <RequestAudit changeList={changeList}/>
      <Segment style={{background: '#f7f7f7'}}>
        <p>The minimum stake for requesting an audit is {DEFAULT_STAKE} QRD.
          <br></br>
          Your current balance is: <BalanceAnnotation />
          <br></br>
          <a href="" target="_blank">How to get QRD?</a>
        </p>
      </Segment>
      {(myAudits.length > 0) &&
      <Segment>
        <Header as='h3' color='blue'>My requests</Header>
        <AuditList 
          auditData={myAudits}
          auditsChange={auditsChange}
        />
      </Segment>
      }
    </Grid.Column>
  )
}
