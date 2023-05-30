import React,  { useEffect, useState } from 'react'
import { Segment } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import ApproveAuditor from './ApproveAuditor'

export default function CouncilPage(props) {
  const { api, currentAccount } = useSubstrateState()
  const [details, setDetails] = useState(null)
  
  useEffect(() => {
    let unsub = null  
    const query = async () => {
      unsub = await api.query.auditModule.auditorMap(
        currentAccount.address,
        (result) => { 
          result.isNone ? setDetails(null) : setDetails(result.toString())
        }
      )
    }
    if (api?.query?.auditModule?.auditorMap && currentAccount) {
      query()
    } 
    return () => unsub && unsub()
  }, [api, currentAccount])

  const isAuditor = details ? true : false

  return (
    <div>
      {isAuditor === false && 
        <div>Sign up to be an auditor first!</div>
      }
      {isAuditor && (
        <div>
          <Segment>
            <ApproveAuditor details={details}/>
          </Segment>
          <Segment>
            <h3>Verify challenge</h3>
          </Segment>
        </div>
      )}
    </div>
  )
}