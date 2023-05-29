import { useState } from 'react'
import { web3FromSource } from '@polkadot/extension-dapp'
import BN from 'bn.js'
import toast from 'react-hot-toast'

import { useSubstrateState } from '../substrate-lib'
import { createToast } from '../toastContent'

export default function useTxAndPost(txAttrs, postAttrs) {
  const { postUrl, resCallback } = postAttrs
  const { palletRpc, callable, finishEvent } = txAttrs

  const sendData= async(postData)=>{
    await fetch(postUrl, {
      method: 'POST',
      body: JSON.stringify(postData),
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        }
    }).then(response => {
      return response.json()
    }
    ).then(data =>{
      if (data.Error || data[0]?.Error || 
        (typeof data === 'string' && data.startsWith('Error'))) 
        toast.error('Error: save failed')
      else toast.success('Data saved')
      resCallback && typeof resCallback === 'function' && resCallback(data)
    }).catch((err) => {
      toast.error("ERROR" + err.message)
    })
  }
  
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

  const signedTx = async (txData, postData) => {
    const fromAcct = await getFromAcct()
    const txExecute = api.tx[palletRpc][callable](...txData)
    
    const unsub = await txExecute
      .signAndSend(...fromAcct,
        ({ status, dispatchError }) => {
          showStatus(status)
          // as subscribed, every status change calls the callback fn
          if (!dispatchError && status.isInBlock) { 
            sendData(postData)
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

  const txAndPost = async (txData, postData) => {
    if (typeof unsub === 'function') {
      unsub()
      setUnsub(null)
    }
    setStatus('Sending...')
    await signedTx(txData, postData)
  }
    
  return {
    txAndPost
  }
}