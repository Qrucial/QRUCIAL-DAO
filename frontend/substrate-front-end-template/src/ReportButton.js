import React, { useState } from 'react'
import { Modal, Button, Form, Input } from 'semantic-ui-react'
import toast from 'react-hot-toast'
import useFormValidation from './hooks/useFormValidation'

export function SendReportButton(props) {
  const [formState, setFormState] = useState({ reportUrl: ''})
  const [open, setOpen] = useState(false)
  
  const onChange = (_, data) => { 
    setFormState(prev => ({ ...prev, [data.name]: data.value }))
  }

  const sendData= async()=>{
    await fetch('/send_report', {
      method: 'POST',
      body: JSON.stringify({ audit_hash: props.audit.hash, reportUrl: formState.reportUrl }),
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
        setOpen(false)
        props.setState(props.audit.hash)
    }).catch((err) => {
      toast.error("ERROR" + err.message)
    })
  }

  const {
    disabled,
    handleBlur,
    showError,
    ErrorLabel,
  } = useFormValidation(formState)

  const isDisabled = () => {
    if (formState.reportUrl?.length === 0) return true
    return disabled
  }

  return (  
    <div>
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        trigger={
          <Button 
            size='tiny' 
            primary 
            type='submit'
            >
            Send Report
          </Button>
        }
        >
        <Modal.Content >
          <Modal.Description>
            <p>Please provide the url of your report</p>
            <Form>
              <Form.Field error={showError('text')}>
                <Input
                  type="text"
                  label="Report Url"
                  name='reportUrl'
                  value={formState.reportUrl}
                  onChange={onChange}
                  onBlur={handleBlur('reportUrl')}         
                />
                <ErrorLabel field={'reportUrl'} text='Some special characters are not allowed'/>
              </Form.Field>
            </Form>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button 
            primary 
            onClick={() => setOpen(false)}
            type='reset'
            >
            Cancel
          </Button>
          <Button 
            primary
            type='submit'
            onClick={sendData}
            disabled={isDisabled()}
            >
            Send Report
          </Button>   
        </Modal.Actions>
      </Modal>
    </div>  
  )
}
