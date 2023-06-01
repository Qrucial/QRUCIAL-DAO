import React, { useState } from 'react'
import { Segment, Header, Form, Input, Dropdown, Button } from 'semantic-ui-react'
import { web3FromSource } from '@polkadot/extension-dapp'
import BN from 'bn.js'
import toast from 'react-hot-toast'

import { useSubstrateState } from './substrate-lib'
import useFormValidation from './hooks/useFormValidation'
import { createToast } from './toastContent'

export default function CreateProposal(props) {
  const { api, currentAccount } = useSubstrateState()
  const initial = {
    threshold: 1,
    proposal: '',
    hash: '',
    reportId: '',
    challengeId: '',
    lengthBound: 5000,
  }
  const [formState, setFormState] = useState(initial) 
  const [unsub, setUnsub] = useState(null)

  const getFromAcct = async () => {
    const {
      address,
      meta: { source, isInjected },
    } = currentAccount
    if (!isInjected) {
      return [currentAccount]
    }
    const injector = await web3FromSource(source)
    return [address, { signer: injector.signer }]
  }
  const setStatus = createToast()
  const showStatus = (status) => {
    status.isFinalized
      ? setStatus(`😉 Finalized. Block hash: ${status.asFinalized.toString()}`)
      : setStatus(`Current transaction status: ${status.type}`)
  }
  const txErrHandler = err => setStatus(`😞 Transaction Failed: ${err.toString()}`)

  const signedTx = async () => {
    const fromAcct = await getFromAcct()
    const unsub = await api.tx.challengeCouncil.propose
    ( formState.threshold,
      api.tx.exoSys[formState.proposal](formState.hash, formState.reportId, formState.challengeId),
      formState.lengthBound
    )
    .signAndSend(...fromAcct,
        ({ status, dispatchError }) => {
          showStatus(status)
          // as subscribed, every status change calls the callback fn
          if (!dispatchError && status.isInBlock) { 
            setFormState(initial)
          }
          if (dispatchError && status.isFinalized) {
            if (dispatchError.isModule) {
              // We have to convert the error to the required format from the type what we get
              // needs revision at substrate updates
              const origError = dispatchError.asModule
              const index = origError.index
              const error = new BN(origError.error[0])
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError({ index, error });
              const { docs, name, section } = decoded;
              toast.error(`${section}.${name}:\n ${docs.join(' ')}`);
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              toast.error(dispatchError.toString());
            }
          }
        }
      )
      .catch(txErrHandler)

    setUnsub(() =>unsub)
  }

  const onClick = async (event, data) => {
    if (!props.details?.includes(currentAccount.address)) {
      toast.error('No permission with this account')
      return
    }
    if (typeof unsub === 'function') {
      unsub()
      setUnsub(null)
    }
    signedTx()
  }

  const extOptions = [
    { key: 'approve', text: 'Approve Challenge', value: 'approveChallenge' },
    { key: 'reject', text: 'Reject Challenge', value: 'rejectChallenge' },
    { key: 'remove', text: 'Remove Challenge', value: 'removeChallenge' },
  ]

  const handleChange = (_, data) => { 
    setFormState(prev => ({ ...prev, [data.name]: data.value }))
  }

  const {
    disabled,
    handleBlur,
    showError,
    ErrorLabel,
  } = useFormValidation(formState)

  return (
    <div>
      <Segment style={{background: '#f7f7f7'}}>
        <Header color="blue" as='h4'>Create proposal</Header> 
        <Form>              
            <Form.Field error={showError('text')}> 
              <Input 
                placeholder={1}
                type="number"
                label="threshold"
                name='threshold'
                value={formState.threshold}
                onChange={handleChange}
                onBlur={handleBlur('threshold')}         
                /> 
              <ErrorLabel field={'threshold'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input 
                type="text"
                label="Review hash"
                name='hash'
                value={formState.hash}
                onChange={handleChange}
                onBlur={handleBlur('hash')}         
                /> 
              <ErrorLabel field={'hash'} text='Needs to be a keccak-256 hash format'/>
            </Form.Field>
            <Form.Field>
              <Dropdown
                fluid
                selection
                options={extOptions}
                onChange={handleChange}
                value={formState.proposal}
                name='proposal'
              />
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input 
                placeholder={0}
                type="number"
                label="Report ID"
                name='reportId'
                value={formState.reportId}
                onChange={handleChange}
                onBlur={handleBlur('reportId')}         
                /> 
              <ErrorLabel field={'reportId'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input 
                placeholder={0}
                type="number"
                label="Challenge ID"
                name='challengeId'
                value={formState.challengeId}
                onChange={handleChange}
                onBlur={handleBlur('challengeId')}         
                /> 
              <ErrorLabel field={'challengeId'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input
                type="number"
                label="lengthBound"
                name='lengthBound'
                value={formState.lengthBound}
                onChange={handleChange}
                onBlur={handleBlur('lengthBound')}         
                /> 
              <ErrorLabel field={'lengthBound'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Button 
              color='blue' 
              type="submit"
              disabled={disabled}
              onClick={onClick}
            >
            Propose         
          </Button>
        </Form>
      </Segment>
    </div>
  )
}
