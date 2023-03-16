import React, { useState, useEffect } from 'react'

import BasicModal from './BasicModal'

export default function AuditList(props) {
  const [auditData, setAuditData] = useState([])

  const getData=()=>{
    fetch('./demoData.json', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      return response.json()
    }
    ).then(data =>{
      setAuditData(data.demoAudits)
    }).catch((err) => {
      console.log(err.message)
    })
  }

  useEffect(()=>{
    getData()
  },[])

  const [modalOpen, setModalOpen] = useState(false)
  const [modalValue, setModalValue] = useState('')

  const handleClick = props.handleClick
  function AuditElem(props) {
    const audit = props.elem;
    return (
      <div
          className='auditorDiv'
          style={{padding: '5px', cursor: 'pointer'}}
          onClick={() => {
            setModalOpen(true);
            setModalValue({content: audit.id, header: audit.requestor });
            handleClick && handleClick(audit);
          }}
        >{audit.requestor}
      </div>
    )
  }

  const list = auditData.map(a => <AuditElem elem={a} key={a.id}/>)

  return (
    <div className='selectBox'>
      {list}
      <BasicModal
        key="auditListModal"
        modalOpen={modalOpen}
        handleClose={() => setModalOpen(false)}
        modalValue={modalValue}
      />
    </div>
  )
}