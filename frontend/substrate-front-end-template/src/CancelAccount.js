import React, { useState } from 'react'
import { Modal, Button } from 'semantic-ui-react'
import useTxAndPost from './hooks/useTxAndPost'

export default function CancelAccount(props) {
  const [open, setOpen] = useState(false)
  
  const postAttrs = { postUrl: '/lar/profile_update' }
  const txAttrs = { palletRpc: 'auditModule', callable: 'cancelAccount', finishEvent: props.finishEvent }

  const { txAndPost } = useTxAndPost(txAttrs, postAttrs)

  const onClick = async (event, data) => {   
    const profileData = {...props.auditorData}
    Object.keys(profileData).forEach(key => {
      if (key === 'address') return
      profileData[key] = '' 
    })
    txAndPost([], profileData)
  }

  return (  
    <div>
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        trigger={<Button basic size='small' color='red'>Delete Account</Button>}
        >
        <Modal.Content >
          <Modal.Description>
            <p>Are you sure you want to delete your auditor account?</p>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button 
            primary 
            onClick={() => setOpen(false)}
            type='reset'
            >
            No, cancel
          </Button>
          <Button 
            color='red'
            type='submit'
            onClick={onClick}
          >
            Delete account
          </Button>   
        </Modal.Actions>
      </Modal>
    </div>  
  )
}
