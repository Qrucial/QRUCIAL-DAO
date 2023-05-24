import React, { useState, useEffect } from 'react'

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

  useEffect(()=>{
    getData()
  },[])

  // 0 requestor | 1 url | 2 state (progress OR done) | 3 automated report (default is empty) |
  // 4 manual report (default is empty | 5 top auditor | 6 challenger

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
              content: { 
                requestor: audit[0], 
                url: audit[1],
                state: audit[2],
                autoReport: audit[3],
                manualReport: audit[4],
                auditor: audit[5],
                challenger: audit[6]
              }, 
              header: audit[1] 
            });
            handleClick && handleClick(audit);
          }}
        >{audit[1]}
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