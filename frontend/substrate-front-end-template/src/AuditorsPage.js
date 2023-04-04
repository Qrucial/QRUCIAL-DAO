import { useState, useEffect } from 'react'
import { Container, Header, Tab } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import Signup from './Signup'
import AuditorProfile from './AuditorProfile'
import AuditRequests from './AuditRequests'

function AuditorTabs(props) {
  const isApproved = props.details?.score !== null ? true : false
  const panes = [
    {
      menuItem: 'Audit requests',
      render: () => (
        <Tab.Pane style={{minHeight: '300px'}}>
          { isApproved ? 
          <AuditRequests />
          : 'Waiting to be approved'
          }
        </Tab.Pane>
      )
    },
    { menuItem: 'Reports', 
      render: () => (
        <Tab.Pane style={{minHeight: '300px'}}>
          { isApproved ? 
            <AuditRequests reports={true} />
           : 'Waiting to be approved'
          }
        </Tab.Pane>
      ) 
    },
    { menuItem: 'Profile', 
      render: () => (
        <Tab.Pane style={{minHeight: '300px'}}>
          <AuditorProfile details={props.details} />
        </Tab.Pane>
      )
    },
  ]  

  return (
    <Tab panes={panes} />
  )
}

function AuditorsPage(props) {
  const { api, currentAccount } = useSubstrateState()
  const [auditorDetails, setAuditorDetails] = useState('')

  const queryResHandler = result => {
    const details = result.isNone ? '' : JSON.parse(result.toString())
    setAuditorDetails(details)
  }
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
  
  const isAuditor = auditorDetails ? true : false
  const isApproved = auditorDetails?.score !== null ? true : false
  const approversCount = auditorDetails?.approvedBy?.length
  const name = currentAccount?.meta?.name

  return (
    <Container>
      { isAuditor ? 
        <>
          <Header as='h3' 
            style={{fontWeight: 'normal'}} 
            textAlign='center'
            >
            Welcome auditor {name}!
          </Header>
          <Header as='h4' 
            style={{
              fontWeight: 'normal', 
              marginTop: '0'}} 
            color='blue' 
            textAlign='center'
            >
            { isApproved ? 
              <span>your current score:&nbsp;
                <span style={{fontWeight:'bold'}}>
                  {auditorDetails?.score}
                </span>
              </span>
              : 
              <span>
                You have already signed up as auditor, waiting for {3-approversCount} approval(s)
              </span>
            }
          </Header>
          <AuditorTabs details={auditorDetails}/>
        </>
        :
        <Signup />
      }
    </Container>
  )
}

export default AuditorsPage
