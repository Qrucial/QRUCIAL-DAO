import React, { useState, useEffect } from 'react'
import { Card, Image, Icon } from 'semantic-ui-react'
import { useSubstrateState } from './substrate-lib'

export default function AuditorPool(props) {  
  const { api } = useSubstrateState()
  const [auditors, setAuditors] = useState([])

  const unsubAll = []
  const getData= async()=>{
    const auditorsData = []
    await fetch('/auditors', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      return response.json()
    }
    ).then(data => {
      data.forEach(auditor => {
        const query = async (address) => {
          await api.query.auditModule.auditorMap(
            address,
            (result) => {                
              const auditorClone = auditor.slice()
              if (!result.isNone) {
                auditorClone.push(JSON.parse(result.toString()).score)
                auditorClone.push(result.value.approvedBy.length)
              }
              const existingIndex = auditorsData.findIndex((elem) => elem.includes(address))
              if (existingIndex > -1) auditorsData[existingIndex] = auditorClone
              else auditorsData.push(auditorClone)
              setAuditors(auditorsData.slice())
            } 
          ).then(unsub => unsubAll.push(unsub))
        }
        query(auditor[0])
      })
    }).catch((err) => {
      console.log(err.message)
      //TODO
    })
  }

  useEffect(()=>{
    getData()
    return () => { 
      for (let i = 0; i < unsubAll.length; i++) {
        unsubAll[i]();
      }
    }
  },[])

  // [0] address, 1 profileHash, 2 name, 3 picUrl, 4 webUrl, 5 bio,
  // 6 auditsDone; 7 score, 8 approvedBy.length
  
  return (         
    <Card.Group itemsPerRow={4} stackable style={{minHeight: '255px'}} >
      {auditors.map((auditor) => (
        <Card style={{boxShadow: 'none', textAlign:'center'}} key={auditor[0]}>
          <div style={{display:'flex', justifyContent: 'center'}}>
            {auditor[3] ?
              <Image circular 
                style={{width: '80%'}}
                alt='avatar'
                src={auditor[3]}/>
              :
              <Icon name='user' size='huge' color='blue'/>
            }
          </div>
          <Card.Description>{auditor[2] || 'no name'}</Card.Description>
          <Card.Meta>{auditor[7]}</Card.Meta>
        </Card>
      ))}
    </Card.Group>
  )
}