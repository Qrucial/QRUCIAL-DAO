import React, { useState } from 'react'
import { Modal, Button, Form } from 'semantic-ui-react'
import { TxButton } from './substrate-lib/components'
import { createToast } from './toastContent'
import { RemoveVuln, AddVuln, PatchVuln } from './ChallengeReportInputs'

export default function ChallengeReportButton(props) {
  const [open, setOpen] = useState(false)

  const removeInitial = [{ removeId: "" }]
  const addInitial = [{ tool: "", addClass: "", addRisk: "", addDescrip: "" }]
  const patchInitial = [{ patchId: "", patchClass: "", patchRisk: "", patchDescrip: "" }]
  const [remove, setRemove] = useState(removeInitial)
  const [add, setAdd] = useState(addInitial)
  const [patch, setPatch] = useState(patchInitial)

  const removeParam = remove?.map(r => r.removeId).filter(id => id)
  const addParam = add?.map((a) => [a.tool, a.addClass, a.addRisk, a.addDescrip])
    .filter((a) => { return a[0] || a[1] || a[2] || a[3] })
  const patchParam = patch?.map((p) => [p.patchId, p.patchClass, p.patchRisk, p.patchDescrip])
    .filter((a) => { return a[0] || a[1] || a[2] || a[3] })

  const inputParams = [ 
    props.auditHash, 
    props.reportId, 
    removeParam, 
    addParam, 
    patchParam 
  ]

  const closeClear = () => {
    setOpen(false)
    setRemove(removeInitial)
    setAdd(addInitial)
    setPatch(patchInitial)
  }

  return (  
    <div>
      <Modal
        onClose={closeClear}
        onOpen={() => setOpen(true)}
        open={open}
        trigger={
          <Button 
            primary 
            type='submit'
            >
            Challenge Report
          </Button>
        }
        >
        <Modal.Content >
          <Modal.Description>
            <Form>              
              <RemoveVuln data={remove} setData={setRemove}/>
              <AddVuln data={add} setData={setAdd}/>
              <PatchVuln data={patch} setData={setPatch}/>
            </Form>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button 
            primary 
            onClick={closeClear}
            type='reset'
            >
            Cancel
          </Button>
          <TxButton 
            label='Challenge Report'
            type='SIGNED-TX' 
            color='blue' 
            setStatus={createToast()}
            txOnClickHandler={closeClear}
            attrs={{
              palletRpc: 'exoSys',
              callable: 'challengeReport',
              inputParams: inputParams,
              paramFields: [    
                { name: 'hash' },
                { name: 'reportId' },                
                { name: 'remove', optional: true },
                { name: 'add', optional: true },
                { name: 'patch', optional: true },
              ],
            }} 
          />    
        </Modal.Actions>
      </Modal>
    </div>  
  )
}
