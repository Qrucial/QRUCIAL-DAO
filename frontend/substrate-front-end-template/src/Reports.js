import { useState, useEffect, useRef } from 'react'
import { Grid, Input, Button } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import AuditList from './AuditList'

export default function Reports(props) {
  const [selected, setSelected] = useState({})
  const { currentAccount } = useSubstrateState()

  const [auditData, setAuditData] = useState([])
  const [auditsChange, setAuditsChange] = useState('')

  const getData=()=>{
    fetch('/audit-requests', {
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

  const handleChange = audit => setSelected(audit)

  useEffect(()=>{
    setAuditsChange(currentAccount?.address)
  },[currentAccount])


  const audits = auditData.filter(a =>
    a.manualReport && a.manualReport !== 'In progress')

  return (
    <Grid>
      <Grid.Column width={8} className='auditorColumn'>
        <AuditList 
          auditData={audits}
          handleClick={handleChange} 
          auditsChange={auditsChange}
          />
      </Grid.Column>
      <Grid.Column width={8}>
        <p>You can view the details of the audit by clicking on the item.
        </p>
        <div style={{textAlign:'center'}}>
          <Input value={selected.projectUrl} onChange={() => setSelected({})}></Input>
          <br/>
          <Button 
            style={{margin:'10px'}} 
            primary
            /* onClick={onClick} */
            >
            Challenge report
          </Button>
        </div>
      </Grid.Column>
    </Grid>
  )
}