import React,  { useEffect, useState } from 'react'
import { Grid, Segment, Header, Form, Dropdown } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import { TxButton } from './substrate-lib/components'
import { createToast } from './toastContent'

export default function ApproveAuditor(props) {
  const { api, currentAccount } = useSubstrateState()
  const [dropdownValue, setDropdownValue] = useState(null)
  const [applicants, setApplicants] = useState([])
  
  const details = props.details
  const metaArgs = api?.tx?.auditModule?.approveAuditor?.meta.args
  const paramName = metaArgs?.[0].name.toString()
  const paramType = metaArgs?.[0].type.toString()

  const [minScore, setMinScore] = useState([])

  useEffect(() => {
    const minScore = api?.consts?.auditModule?.minimalApproverScore
    setMinScore(minScore.toJSON())
  }, [api])

  const score = details && details.score
  const isAllowed = score >= minScore ? true : false 
  
  const approvee = currentAccount?.address
  const unsubAll = []
  let signedUps = []

  const getData= async()=>{
    await fetch('/auditors', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        }
    }).then(response => {
      return response.json()
    }).then(data => {
      data.forEach(auditor => {
        const query = async (address) => {
          await api.query.auditModule.auditorMap(
            address,
            (result) => {
              const option = {
                key: auditor.address,
                value: auditor.address,
                text: auditor.name,
              }
              if (result.isNone) return 
              if (!result.value.score.eq(null)) {
                if (result.value.approvedBy.includes(approvee)) {
                  signedUps = signedUps.filter(elem => elem.key !== auditor.address)
                } else return }
              if (!result.value.approvedBy.includes(approvee) && 
                !signedUps.find(elem => elem.key === auditor.address)) {
                  signedUps.push(option)
              }
              else if (result.value.approvedBy.includes(approvee)) {
                signedUps = signedUps.filter(elem => elem.key !== auditor.address)
              }
              setApplicants(signedUps.slice())
            }    
          ).then(unsub => unsubAll.push(unsub))
        }
        query(auditor.address)
      })
    }).catch((err) => {
      console.log(err.message)
    //TODO
    })
  }
  
  useEffect(()=>{
    getData()
    setDropdownValue(null)
    return () => { 
      for (let i = 0; i < unsubAll.length; i++) {
        unsubAll[i]();
      }
    }
  },[currentAccount])

  const onChange = (e, dropdown) => {
    setDropdownValue(dropdown.value)
  }

  return (
    <Grid.Column>
      <Header as='h3'>Approve auditor</Header> 
      <Segment style={{background: '#f7f7f7'}}>
        <p>Those who signed up to be an auditor need to be recommended by three other auditors.</p>
        <p>The minimal score which allows auditors to approve other auditors: {minScore}. 
        Your score is {score || 0}.</p>
        {isAllowed && <div> 
            <p>Select from the applicants' list to approve a new auditor</p>
          <Form>
            <Form.Field>
              <Dropdown
                placeholder="Select from available addresses"
                fluid
                selection
                search
                options={applicants}
                onChange={onChange}
                value={dropdownValue}
              />
            </Form.Field>
            <Form.Field style={{ textAlign: 'center' }}>
              <TxButton 
                label='Approve'
                type='SIGNED-TX' 
                color='blue' 
                setStatus={createToast()}
                txOnClickHandler={() => setDropdownValue(null)}
                attrs={{
                  palletRpc: 'auditModule',
                  callable: 'approveAuditor',
                  inputParams: [dropdownValue],
                  paramFields: [{ name: paramName, type: paramType }],
                }} 
              /> 
            </Form.Field>
          </Form>
        </div>}
      </Segment>
    </Grid.Column>
  )
}
