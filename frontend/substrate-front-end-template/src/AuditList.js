import React, { useState } from 'react'

import BasicModal from './BasicModal'

export default function AuditList(props) {
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

  const list = props.auditData.map((a, i) => <AuditElem elem={a} key={i}/>)

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