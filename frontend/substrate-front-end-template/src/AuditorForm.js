import React, { useState } from 'react'
import { Form, Input, Button, Divider } from 'semantic-ui-react'
import { keccak_512 } from 'js-sha3'
import { web3FromSource } from '@polkadot/extension-dapp'
import BN from 'bn.js'
import toast from 'react-hot-toast'

import { useSubstrateState } from './substrate-lib'
import { createToast } from './toastContent'

export default function AuditorForm(props) {
  const auditorData = props.auditorData
  const auditorFields = {...auditorData}
  delete auditorFields.profileHash
  const [formState, setFormState] = useState(auditorFields) 

  const postData= async(profileData)=>{
    await fetch('/profile_update', {
      method: 'POST',
      body: JSON.stringify(profileData),
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      return response.json()
    }
    ).then(data =>{
      if (data.profileHash === profileData.profileHash) 
        toast.success('Profile data saved')
    }).catch((err) => {
      toast.error("ERROR" + err.message)
    })
  }

  const finishEvent = props.finishEvent

  //////// TX part ///////////////////////  
  const { api, currentAccount } = useSubstrateState()
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

  const signedTx = async (profileData, profileHash) => {
    const fromAcct = await getFromAcct()
    const txExecute = api.tx.auditModule[props.method](profileHash)
    
    const unsub = await txExecute
      .signAndSend(...fromAcct,
        ({ status, dispatchError }) => {
          showStatus(status)
          // as subscribed, every status change calls the callback fn
          if (!dispatchError && status.isInBlock) { 
            postData(profileData)
            finishEvent && typeof finishEvent === 'function' && finishEvent()
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

    setUnsub(() => unsub)
  }

  const transaction = async (profileData, profileHash) => {
    if (typeof unsub === 'function') {
      unsub()
      setUnsub(null)
    }
    setStatus('Sending...')
    await signedTx(profileData, profileHash)
  }
  /////////  End of Tx part  ////////////////////////
  
  const onClick = async (event, data) => {
    if (formState.address != currentAccount.address) {
      toast.error('No permission with this account')
      return
    }    
    const inputParams = {...formState}
    const profileHash = keccak_512(JSON.stringify(inputParams))
    const profileData = Object.assign({}, inputParams, { profileHash });
 
    transaction(profileData, profileHash)
  }
  
  const onChange = (target) => { 
    setFormState(prev => ({ ...prev, [target.name]: target.value }))
  }

  let buttonLabel
  if (props.method === 'signUp') buttonLabel = 'Sign Up'
  else if (props.method === 'updateProfile') buttonLabel = 'Update Profile'

  return (  
    <div>
      <Form>
        <FieldsFromList auditorFields={auditorFields} onChange={onChange} state={formState}/>
        <Form.Field style={{ textAlign: 'right' }}>  
          { props.method === 'updateProfile' &&
            <Button 
              color='blue' 
              type="submit"
              onClick={() => finishEvent()}
              >
              Cancel
            </Button> 
          }
          <Button 
            color='blue' 
            type="submit"
            onClick={onClick}
            >
            {buttonLabel}
          </Button>              
        </Form.Field>
        <Divider hidden />
      </Form>
    </div> 
  )
}

function FieldsFromList(props) {
  function onFieldChange(event) {
    props.onChange(event.target);
  }
  const fields = Object.entries(props.auditorFields).map(([key, value]) => {
    if (key === 'address' || key === 'profileHash') return null
    else return (
      <Form.Field key={key}>
        <Input
          placeholder={value}
          type="text"
          label={key}
          name={key}
          value={props.state[key]}
          onChange={onFieldChange}          
        />
      </Form.Field>
    )
  })
  return <>{fields}</>
}
