import React from 'react'
import { Card, Image, Icon } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'

export default function AuditorPool(props) {

  /* ----- For demo only ----- */
  const { keyring } = useSubstrateState()
  const keyringOptions = keyring.getPairs().map(account => ({
    key: account.address,
    value: account.address,
    username: account.meta.name,
  }))
  const demoAuditors = keyringOptions.slice(0, 8)
  /* ------------- */
  
/*   const [auditorsData, setAuditorsData] = useState([])

  const getData=()=>{
    fetch('', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      return response.json()
    }
    ).then(data =>{
      setAuditorsData(data)
    }).catch((err) => {
      console.log(err.message)
      //TODO
    })
  }

  useEffect(()=>{
    getData()
  },[]) */

  const auditors = demoAuditors

  return (
    <Card.Group itemsPerRow={4} stackable style={{height: '255px'}} >
        {auditors.map((auditor) => (
          <Card style={{boxShadow: 'none', textAlign:'center'}} key={auditor.key}>
            <div style={{display:'flex', justifyContent: 'center'}}>
              {auditor.avatar ?
                <Image circular 
                  style={{width: '80%'}}
                  alt='avatar'
                  src={auditor.avatar}/>
                :
                <Icon name='user' size='huge' color='blue'/>
              }
            </div>
            <Card.Description>{auditor.username}</Card.Description>
          </Card>
        ))}
      </Card.Group>
  )
}