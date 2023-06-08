import { useState, useEffect, useRef } from 'react'
import { Grid, Input, Button, Header } from 'semantic-ui-react'
import toast from 'react-hot-toast'

import { useSubstrateState } from './substrate-lib'
import AuditList from './AuditList'

export default function AuditRequests(props) {
  const [selected, setSelected] = useState({ hash: ''})
  const { currentAccount } = useSubstrateState()

  const [auditData, setAuditData] = useState([])
  const [auditsChange, setAuditsChange] = useState('')

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

  const handleChange = audit => setSelected(audit)

  const sendData= async(postData)=>{
    await fetch('/lar/take_audit', {
      method: 'POST',
      body: JSON.stringify(postData),
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
      if (data.Error || data[0]?.Error || 
        (typeof data === 'string' && data.startsWith('Error'))) 
        toast.error('Error: save failed')
      else toast.success('Data saved')
      setSelected({ hash: '' })
      setAuditsChange(postData)
    }).catch((err) => {
      toast.error("ERROR " + err.message)
    })
  }

  useEffect(()=>{
    setAuditsChange(currentAccount?.address)
  },[currentAccount])

  const onClick = () => {
    const audit_taker = currentAccount?.address
    const audit_hash = selected.hash
    const signature = currentAccount.sign(audit_hash)
    const isValid = currentAccount.verify(audit_hash, signature, currentAccount.publicKey)
    if (isValid) sendData({ audit_taker, audit_hash })
    else toast.error('Signature is not valid')
  }

  const nonTakenAudits = auditData.filter(a => a.topAuditor?.length <= 16)

  const myAudits = auditData.filter(a => a.topAuditor === currentAccount.address)

  const description = props.reports ? 
    'you can choose the report you would like to challenge.'
    : 'you can choose the audit to take.'
  const buttonText = props.reports ? 'Challenge report' : 'Take it'

  return (
    <Grid>
      <Grid.Row>
        <Grid.Column width={8} className='auditorColumn'>
          {nonTakenAudits.length > 0 &&
          <AuditList 
            auditData={nonTakenAudits}
            handleClick={handleChange} 
            auditsChange={auditsChange}
          />
          }
        </Grid.Column>
        <Grid.Column width={8}>
          <p>You can view the details of the audit by clicking on the item.
            Also by clicking on it {description}
          </p>
          <div style={{textAlign:'center'}}>
            <Input value={selected.hash} onChange={() => setSelected({hash: ''})}></Input>
            <br/>
            <Button 
              style={{margin:'10px'}} 
              primary
              onClick={onClick}>
              {buttonText}
            </Button>
          </div>
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        {myAudits?.length > 0 &&
          <Grid.Column>
            <Header as='h3' style={{fontWeight: 'normal'}}>
              Your audits
            </Header>
            <AuditList 
              auditData={myAudits}
              auditsChange={auditsChange}
              reportButton={true}
              setState={setAuditsChange}
              />
          </Grid.Column>
        }
      </Grid.Row>
    </Grid>
  )
}