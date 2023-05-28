import React, { useState, useEffect, useRef } from 'react'

import BasicModal from './BasicModal'

export default function AuditList(props) {
  const [auditData, setAuditData] = useState([])

  const getData=()=>{
    fetch('/audit-requests', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      return response.json()
    }
    ).then(data =>{
      setAuditData(data)
    }).catch((err) => {
      console.log(err.message)
    })
  }

  const initialRender = useRef(true);
  useEffect(()=>{
    if (initialRender.current) {
      getData()
      initialRender.current = false;
    } else {
      setTimeout(() => {
        getData()
      }, 1000)
    }
  },[props.auditsChange])

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
            setModalValue({
              content: audit,
              header: audit.projectUrl 
            });
            handleClick && handleClick(audit);
          }}
        >{audit.projectUrl}
      </div>
    )
  }

  const list = auditData.map((a, i) => <AuditElem elem={a} key={i}/>)

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