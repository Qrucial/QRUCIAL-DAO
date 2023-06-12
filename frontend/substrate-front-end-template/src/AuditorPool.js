import React, { useState, useEffect } from 'react'
import { Card, Image, Icon } from 'semantic-ui-react'
import { useSubstrateState } from './substrate-lib'
import BasicModal from './BasicModal'

export default function AuditorPool(props) {  
  const { api } = useSubstrateState()
  const [auditors, setAuditors] = useState([])
  const [auditorModalOpen, setAuditorModalOpen] = useState(false)
  const [auditorModalValue, setAuditorModalValue] = useState('')

  const unsubAll = []
  const getData= async()=>{
    const auditorsData = []
    await fetch('/lar/auditors', {
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
    ).then(data => {
      data.forEach(auditor => {
        const query = async (address) => {
          await api.query.auditModule.auditorMap(
            address,
            (result) => {                
              const auditorClone = {...auditor}
              if (result.isNone) {
                // TBA handle auditor data in db not existing onchain
              } else {
                const score = (JSON.parse(result.toString()).score);
                const approvedByCount = result.value.approvedBy.length
                Object.assign(auditorClone, { score, approvedByCount })
                const existingIndex = auditorsData.findIndex((elem) => 
                  Object.values(elem).includes(address))
                if (existingIndex > -1) auditorsData[existingIndex] = auditorClone
                else auditorsData.push(auditorClone)
              }
              setAuditors(auditorsData.slice())
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
    return () => { 
      for (let i = 0; i < unsubAll.length; i++) {
        unsubAll[i]();
      }
    }
  },[])
  
  const sortedAuditors = auditors.slice().sort(
    (a, b) => b.score - a.score || 
      (!a.name ? 1 : (!b.name ? -1 : (a.name.localeCompare(b.name)))))
  
  const displayName = (name) => {
    if (!name) return 'no name'
    else if (name.length > 10) return name.slice(0, 9) + '...'
    return name
  }

  return (         
    <Card.Group itemsPerRow={4} stackable style={{minHeight: '255px'}} >
      {sortedAuditors.map((auditor) => (
        <Card 
          style={{boxShadow: 'none', textAlign:'center'}} 
          key={auditor.address}
          onClick={() => {
            setAuditorModalOpen(true);
            setAuditorModalValue({
              content: auditor,
              header: auditor.name 
            });
          }}
          >
          <div style={{
            display:'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '80px'
            }}>
            {auditor.picUrl ?
              <Image circular 
                style={{maxWidth: '100%', maxHeight: '100%'}}
                alt='avatar'
                src={auditor.picUrl}/>
              :
              <Icon name='user' size='huge' color='blue'/>
            }
          </div>
          <Card.Description>{displayName(auditor.name)}</Card.Description>
          <Card.Meta>{auditor.score}</Card.Meta>
        </Card>
      ))}
      <BasicModal
        key="auditorModal"
        modalOpen={auditorModalOpen}
        handleClose={() => { 
          setAuditorModalOpen(false)
          setAuditorModalValue('')
        }}
        modalValue={auditorModalValue}
      />
    </Card.Group>
  )
}