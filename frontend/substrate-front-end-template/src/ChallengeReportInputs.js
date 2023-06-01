import React from 'react'
import { Button, Form, Input, Dropdown, Header, Divider } from 'semantic-ui-react'
import useFormValidation from './hooks/useFormValidation'

export function RemoveVuln(props){
  const data = props.data
  const setData = props.setData

  const handleClick=()=>{
    setData([...data, { removeId: "" }])
  }

  const handleChange=(e,i)=>{
    const {name,value}= e.target
    const onchangeVal = [...data]
    onchangeVal[i][name] = value
    setData(onchangeVal)
  }

  const handleDelete=(i)=>{
    const deleteVal = [...data]
    deleteVal.splice(i,1)
    setData(deleteVal)
  }

  const {
   // disabled,
    handleBlur,
    showError,
    ErrorLabel,
  } = useFormValidation(data)
  
  return (
    <div className='RemoveVulns'>
      <div>
        <Header color="blue" as='h4' style={{display:"inline-block"}}>
          Remove vulnerabilities
        </Header>
        <Button onClick={handleClick} style={{marginLeft:"20px"}} size="tiny">+</Button>
      </div>
      {
        data.map((val,i) => 
          <div key={i}>
            <Form.Field error={showError('text')}>
              <Input
                placeholder='0'
                style={{width:"90%"}}
                type='number'
                label='Vulnerability Id'
                name='removeId'
                value={data[i].removeId}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('removeId')}         
                /> 
              <Button 
                style={{float: "right"}}
                onClick={()=>handleDelete(i)} 
                size="small"
                >
                -
              </Button>
              <ErrorLabel field={'removeId'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Divider/>
          </div>
        )
      }
    </div>
  )
}

export function AddVuln(props){
  const data = props.data
  const setData = props.setData

  const handleClick=()=>{
    setData([...data, { tool: "", addClass: "", addRisk: "", addDescrip: "" }])
  }

  const handleChange=(e,i)=>{
    const {name,value}= e.target
    const onchangeVal = [...data]
    onchangeVal[i][name] = value
    setData(onchangeVal)
  }

  const handleDelete=(i)=>{
      const deleteVal = [...data]
      deleteVal.splice(i,1)
      setData(deleteVal)
  }

  const toolOptions = [
    { key: 'Manual', text: 'Manual', value: 'Manual' },
    { key: 'Clippy', text: 'Clippy', value: 'Clippy' },
    { key: 'CargoAudit', text: 'CargoAudit', value: 'CargoAudit' },
    { key: 'Octopus', text: 'Octopus', value: 'Octopus' }
  ]

  const {
   // disabled,
    handleBlur,
    showError,
    ErrorLabel,
  } = useFormValidation(data)
  
  return (
    <div className='AddVuln'>
      <div>
        <Header color="blue" as='h4' style={{display:"inline-block"}}>
          Add vulnerabilities
        </Header>
        <Button onClick={handleClick} style={{marginLeft:"20px"}} size="tiny">+</Button>
      </div>
      {
        data.map((val,i) => 
          <div key={i}>
            <Form.Field>
              <Dropdown
                style={{width:"90%", display:"inline-block"}}
                placeholder='Select Tool'
                fluid
                selection
                options={toolOptions}
                onChange={(_, dropdown) => { 
                  const onchangeVal = [...data]
                  onchangeVal[i].tool = dropdown.value
                  setData(onchangeVal)
                }}
                value={data.addTool}
                name='addTool'
              />
              <Button 
                style={{float: "right"}}
                onClick={()=>handleDelete(i)} 
                size="small"
                >
                -
              </Button>
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input 
                style={{width:"90%"}}
                type='number'
                label="classification"
                name='addClass'
                value={data[i].addClass}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('addClass')}         
                /> 
              <ErrorLabel field={'addClass'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input
                style={{width:"90%"}} 
                type='number'
                label="risk"
                name='addRisk'
                value={data[i].addRisk}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('addRisk')}         
                /> 
              <ErrorLabel field={'addRisk'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input 
                style={{width:"90%"}}
                type="text"
                label="description"
                name='addDescrip'
                value={data[i].addDescrip}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('addDescrip')}         
                /> 
              <ErrorLabel field={'addDescrip'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Divider/>
          </div>
        )
      }
    </div>
  )
}

export function PatchVuln(props){
  const data = props.data
  const setData = props.setData

  const handleClick=()=>{
    setData([...data, { patchId: "", patchClass: "", patchRisk: "", patchDescrip: "" }])
  }

  const handleChange=(e,i)=>{
    const {name,value}= e.target
    const onchangeVal = [...data]
    onchangeVal[i][name] = value
    setData(onchangeVal)
  }

  const handleDelete=(i)=>{
      const deleteVal = [...data]
      deleteVal.splice(i,1)
      setData(deleteVal)
  }

  const {
   // disabled,
    handleBlur,
    showError,
    ErrorLabel,
  } = useFormValidation(data)
  
  return (
    <div className='PatchVuln'>
      <div>
        <Header color="blue" as='h4' style={{display:"inline-block"}}>
          Patch vulnerabilities
        </Header>
        <Button onClick={handleClick} style={{marginLeft:"20px"}} size="tiny">+</Button>
      </div>
      {
        data.map((val,i) => 
          <div key={i}>
            <Form.Field error={showError('text')}> 
              <Input 
                placeholder={0}
                style={{width:"90%"}}
                type="number"
                label="Vulnerability Id"
                name='patchId'
                value={data[i].patchId}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('patchId')}         
                /> 
              <ErrorLabel field={'patchId'} text='Some special characters are not allowed'/>
              <Button 
                style={{float: "right"}}
                onClick={()=>handleDelete(i)} 
                size="small"
                >
                -
              </Button>
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input 
                style={{width:"90%"}}
                type="number"
                label="classification"
                name='patchClass'
                value={data[i].patchClass}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('patchClass')}         
                /> 
              <ErrorLabel field={'patchClass'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input
                style={{width:"90%"}} 
                type="number"
                label="risk"
                name='patchRisk'
                value={data[i].patchRisk}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('patchRisk')}         
                /> 
              <ErrorLabel field={'patchRisk'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('text')}> 
              <Input 
                style={{width:"90%"}}
                type="text"
                label="description"
                name='patchDescrip'
                value={data[i].patchDescrip}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('patchDescrip')}         
                /> 
              <ErrorLabel field={'patchDescrip'} text='Some special characters are not allowed'/>
            </Form.Field>
            <Divider/>
          </div>
        )
      }
    </div>
  )
}