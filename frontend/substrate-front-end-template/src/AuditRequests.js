import { useState } from 'react'
import { Grid, Input, Button } from 'semantic-ui-react'

import AuditList from './AuditList'

export default function AuditRequests(props) {
  const [selected, setSelected] = useState({requestor:'', id:''})

  const handleChange = audit => setSelected(audit)

  const description = props.reports ? 
    'you can choose the report you would like to challenge.'
    : 'you can choose the audit to take.'
  const buttonText = props.reports ? 'Challenge report' : 'Take it'

  return (
    <Grid>
      <Grid.Column width={8} className='auditorColumn'>
        <AuditList handleClick={handleChange}/>
      </Grid.Column>
      <Grid.Column width={8}>
        <p>You can view the details of the audit by clicking on the item.
          Also by clicking on it {description}
        </p>
        <div style={{textAlign:'center'}}>
          <Input value={selected.requestor}></Input>
          <br/>
          <Button style={{margin:'10px'}} color='blue'>
            {buttonText}
          </Button>
        </div>
      </Grid.Column>
    </Grid>
  )
}