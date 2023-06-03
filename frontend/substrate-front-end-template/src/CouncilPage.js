import React,  { useEffect, useState } from 'react'
import { Segment, Header } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import Challenges from './Challenges'

export default function CouncilPage(props) {
  const { api, currentAccount } = useSubstrateState()
  const [details, setDetails] = useState(null)

  useEffect(() => {
    let unsub = null  
    const query = async () => {
      unsub = await api.query.challengeCouncil.members(
        undefined,
        (result) => { 
          result.isNone ? setDetails(null) : setDetails(result.toString())
        }
      )
    }
    if (currentAccount) {
      query()
    } 
    return () => unsub && unsub()
  }, [api, currentAccount])

  const isCouncil = details?.includes(currentAccount.address) ? true : false

  return (
    <div>
      {isCouncil === false && 
        <div>You are not yet member of the council.</div>
      }
      {isCouncil && (
        <div>
          <Segment style={{ backgroundColor: '#f7f7f7'}}>
            <Header as='h3'>Verify Challenge</Header> 
            <Challenges details={details}/>
          </Segment>
        </div>
      )}
    </div>
  )
}