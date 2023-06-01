import React, { useState } from 'react'

import BasicModal from './BasicModal'
import { SendReportButton } from './ReportButton.js'

export default function AuditList(props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalValue, setModalValue] = useState('')

  const handleClick = props.handleClick
  const setState = props.setState

  function AuditElem(props) {
    const audit = props.elem;
    const onClick = props.onClick ||
      function(audit) {
        setModalOpen(true);
        setModalValue({
          content: audit,
          header: audit.projectUrl 
        });
        handleClick && handleClick(audit);
      }

    return (
      <>
        <div
          className='auditorDiv'
          style={{padding: '5px', cursor: 'pointer', wordBreak: 'break-word'}}
          onClick={() => onClick(audit)}
          >
          {audit.projectUrl}
        </div>
        {props.reportButton && 
          <SendReportButton audit={audit} setState={setState}/>
        }
      </>
    )
  }

  const list = props.auditData.map((a, i) => (
    <AuditElem 
      elem={a} 
      key={i} 
      reportButton={props.reportButton}
      onClick={props.onClick}
      />)
  )

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