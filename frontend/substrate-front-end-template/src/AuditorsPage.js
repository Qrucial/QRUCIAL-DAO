import { useState, useEffect, useRef } from 'react'
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
          <AuditorProfile details={props.details} auditorData={props.auditorData} />
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
  const [onChainDetails, setOnChainDetails] = useState('')

  useEffect(() => {
    let unsub = null
    const query = async () => {
      const params = [currentAccount?.address]
      unsub = await api.query.auditModule.auditorMap(
        ...params,
        result => {
          const details = result.isNone ? '' : JSON.parse(result.toString())
          setOnChainDetails(details)
        }
      )
    }
    if (api?.query?.auditModule?.auditorMap && currentAccount) {
      query()
    } 
    return () => unsub && unsub()
  }, [api, currentAccount])
  
  const [auditorData, setAuditorData] = useState('')
  
  const address = currentAccount?.address
  const getData= async()=>{
    await fetch('/auditor-data?' + new URLSearchParams({ address }), {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      return response.json()
    }
    ).then(data =>{
      setAuditorData(data[0])
    }).catch((err) => {
      console.log(err.message)
    })
  }
  
  useEffect(()=>{
    getData()
  },[currentAccount])

  const initialRender = useRef(true);
  useEffect(()=>{
    if (initialRender.current) {
      initialRender.current = false;
    } else {
      setTimeout(() => {
        getData()
      }, 1000)
    }
  },[onChainDetails])
  
  const isAuditor = onChainDetails ? true : false
  const isApproved = onChainDetails?.score !== null ? true : false
  const approversCount = onChainDetails?.approvedBy?.length
  const accountName = currentAccount?.meta?.name
  const name = auditorData?.name || accountName

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
                  {onChainDetails?.score}
                </span>
              </span>
              : 
              <span>
                You have already signed up as auditor, waiting for {3-approversCount} approval(s)
              </span>
            }
          </Header>
          <AuditorTabs details={onChainDetails} auditorData={auditorData}/>
        </>
        :
        <Signup address={currentAccount?.address}/>
      }
    </Container>
  )
}

export default AuditorsPage
