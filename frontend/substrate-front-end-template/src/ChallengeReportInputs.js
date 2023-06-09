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
  } = useFormValidation(data, props.setDisabled)
  
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
            <Form.Field error={showError('removeId' + i)}>
              <Input
                placeholder='0'
                style={{width:"90%"}}
                type='number'
                label='Vulnerability Id'
                name='removeId'
                value={data[i].removeId}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('removeId' + i)}         
                /> 
              <Button 
                style={{float: "right"}}
                onClick={()=>handleDelete(i)} 
                size="small"
                >
                -
              </Button>
              <ErrorLabel field={'removeId' + i} text='Some special characters are not allowed'/>
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
  } = useFormValidation(data, props.setDisabled)
  
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
            <Form.Field error={showError('addClass' + i)}> 
              <Input 
                style={{width:"90%"}}
                type='number'
                label="classification"
                name='addClass'
                value={data[i].addClass}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('addClass' + i)}         
                /> 
              <ErrorLabel field={'addClass' + i} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('addRisk' + i)}> 
              <Input
                style={{width:"90%"}} 
                type='number'
                label="risk"
                name='addRisk'
                value={data[i].addRisk}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('addRisk' + i)}         
                /> 
              <ErrorLabel field={'addRisk' + i} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('addDescrip' + i)}> 
              <Input 
                style={{width:"90%"}}
                type="text"
                label="description"
                name='addDescrip'
                value={data[i].addDescrip}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('addDescrip' + i)}         
                /> 
              <ErrorLabel field={'addDescrip' + i} text='Some special characters are not allowed'/>
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
  } = useFormValidation(data, props.setDisabled)
  
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
            <Form.Field error={showError('patchId' + i)}> 
              <Input 
                placeholder={0}
                style={{width:"90%"}}
                type="number"
                label="Vulnerability Id"
                name='patchId'
                value={data[i].patchId}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('patchId' + i)}         
                /> 
              <ErrorLabel field={'patchId' + i} text='Some special characters are not allowed'/>
              <Button 
                style={{float: "right"}}
                onClick={()=>handleDelete(i)} 
                size="small"
                >
                -
              </Button>
            </Form.Field>
            <Form.Field error={showError('patchClass' + i)}> 
              <Input 
                style={{width:"90%"}}
                type="number"
                label="classification"
                name='patchClass'
                value={data[i].patchClass}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('patchClass' + i)}         
                /> 
              <ErrorLabel field={'patchClass' + i} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('patchRisk' + i)}> 
              <Input
                style={{width:"90%"}} 
                type="number"
                label="risk"
                name='patchRisk'
                value={data[i].patchRisk}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('patchRisk' + i)}         
                /> 
              <ErrorLabel field={'patchRisk' + i} text='Some special characters are not allowed'/>
            </Form.Field>
            <Form.Field error={showError('patchDescrip' + i)}> 
              <Input 
                style={{width:"90%"}}
                type="text"
                label="description"
                name='patchDescrip'
                value={data[i].patchDescrip}
                onChange={(e)=>handleChange(e,i)}
                onBlur={handleBlur('patchDescrip' + i)}         
                /> 
              <ErrorLabel field={'patchDescrip' + i} text='Some special characters are not allowed'/>
            </Form.Field>
            <Divider/>
          </div>
        )
      }
    </div>
  )
}