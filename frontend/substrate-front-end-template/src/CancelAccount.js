import React, { useState } from 'react'
import { Modal, Button } from 'semantic-ui-react'
import { TxButton } from './substrate-lib/components'

export default function CancelAccount(props) {
  const [open, setOpen] = useState(false)
  
  return (  
    <div>
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        trigger={<Button basic size='small' color='red'>Cancel Account</Button>}
        >
        <Modal.Content >
          <Modal.Description>
            <p>Are you sure you want to delete your auditor account?</p>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button color='grey' onClick={() => setOpen(false)}>
            No, cancel the cancel
          </Button>
          <TxButton 
            label="Delete Account"
            type='SIGNED-TX' 
            color='red' 
            setStatus={props.setStatus}
            txOnClickHandler={() => setOpen(false)}
            attrs={{
              palletRpc: 'auditModule',
              callable: 'cancelAccount',
              inputParams: [],
              paramFields: [],
            }} 
          />  
        </Modal.Actions>
      </Modal>
      <p>{props.status}</p>
    </div>  
  )
}
