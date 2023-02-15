import React,  { useEffect, useState } from 'react'
import { Grid, Segment, Header, Form, Dropdown } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import { TxButton } from './substrate-lib/components'
import { createToast } from './toastContent'

export default function ApproveAuditor(props) {
  const { api, keyring, currentAccount } = useSubstrateState()
  const [details, setDetails] = useState(null)
  const [dropdownValue, setDropdownValue] = useState(null)
  const [applicants, setApplicants] = useState([])

  const metaArgs = api?.tx?.auditModule?.approveAuditor?.meta.args
  const paramName = metaArgs?.[0].name.toString()
  const paramType = metaArgs?.[0].type.toString()

  useEffect(() => {
    let unsub = null  
    const query = async () => {
      unsub = await api.query.auditModule.auditorMap(
        currentAccount.address,
        result => result.isNone ? setDetails(null) : setDetails(result.toString())
      )
    }
    if (api?.query?.auditModule?.auditorMap && currentAccount) {
      query()
    } 
    return () => unsub && unsub()
  }, [api, currentAccount])

  const score = details && JSON.parse(details).score
  const isAuditor = score > 0 ? true : false 

  // ************ FOR DEMO ONLY ***************
  useEffect(() => {  
    const keyringOptions = keyring.getPairs().map(account => ({
      key: account.address,
      value: account.address,
      text: account.meta.name,
    }))
    const approvee = currentAccount?.address
    let signedUps = []
    let unsub
    const unsubAll = []
    keyringOptions.forEach(option => {
      const query = async (address) => {
        unsub = await api.query.auditModule.auditorMap(
          address,
          (result) => {
            if (result.isNone || !result.value.score.eq(null)) return 
            if (!result.value.approvedBy.includes(approvee)) {
              if (!signedUps.find(e => e.value === option.value)) {
                signedUps.push(option)
              }
            }
            else if (result.value.approvedBy.includes(approvee) 
              && signedUps.find(e => e.value === option.value)) {
                signedUps = signedUps.filter(elem => elem.value !== option.value)
            }
            setApplicants(signedUps)
          }    
        )
        unsubAll.push(unsub)
      }
      query(option.value)
    }) 
    setDropdownValue(null)
    
    return () => { 
      for (let i = 0; i < unsubAll.length; i++) {
        unsubAll[i]();
      }
    }
  }, [keyring, currentAccount])
  // *********************************************

  const onChange = (e, dropdown) => {
    setDropdownValue(dropdown.value)
  }

  return (
    <Grid.Column>
      <Header as='h3'>Approve auditor</Header> 
      <Segment style={{background: '#f7f7f7'}}>
        <p>Those who signed up to be an auditor need to be recommended by three other auditors.</p>
        {isAuditor && <div> 
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
