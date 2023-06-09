import React, { useState } from 'react'
import { Modal, Button, Form } from 'semantic-ui-react'
import useTxAndPost from './hooks/useTxAndPost'
import { useSubstrateState } from './substrate-lib'
import { RemoveVuln, AddVuln, PatchVuln } from './ChallengeReportInputs'

export default function ChallengeReportButton(props) {
  const [open, setOpen] = useState(false)
  const { currentAccount } = useSubstrateState()

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

  const closeClear = () => {
    setOpen(false)
    setRemove(removeInitial)
    setAdd(addInitial)
    setPatch(patchInitial)
  }

  const postAttrs = { postUrl: '/lar/challenge_audit' }
  const txAttrs = { palletRpc: 'exoSys', callable: 'challengeReport', finishEvent: closeClear }

  const { txAndPost } = useTxAndPost(txAttrs, postAttrs)

  const onClick = async (event, data) => {  
    const inputParams = [ 
      props.auditHash, 
      props.reportId, 
      removeParam, 
      addParam, 
      patchParam 
    ]
    const postData = { audit_hash: props.auditHash, challenger: currentAccount.address }
    txAndPost(inputParams, postData)
  }

  const [disabledRem, setDisabledRem] = useState(false)
  const [disabledAdd, setDisabledAdd] = useState(false)
  const [disabledPatch, setDisabledPatch] = useState(false)
  const disabled = disabledRem || disabledAdd || disabledPatch

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
              <RemoveVuln data={remove} setData={setRemove} setDisabled={setDisabledRem}/>
              <AddVuln data={add} setData={setAdd} setDisabled={setDisabledAdd} />
              <PatchVuln data={patch} setData={setPatch} setDisabled={setDisabledPatch}/>
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
          <Button 
            primary
            type="submit"
            disabled={disabled}
            onClick={onClick}
            >
            Challenge Report
          </Button> 
        </Modal.Actions>
      </Modal>
    </div>  
  )
}
