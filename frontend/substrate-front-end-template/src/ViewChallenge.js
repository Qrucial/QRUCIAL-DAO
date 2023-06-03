import React, { useState, useEffect } from 'react'
import { Grid, Header, List } from 'semantic-ui-react'
import CreateProposal from './CreateProposal'

export default function ViewChallenge(props) {
  const challenge = props.challenge
  const report = props.reports?.find((elem) => {
    return (
      elem.auditHash === challenge.auditHash && 
      elem.reportId === challenge.reportId)
  })
  const auditUrl = props.auditState.find(a => 
    a.hash === challenge.auditHash)?.projectUrl

  const getData = async(address, setState )=>{
    await fetch('/lar/auditor-data?' + new URLSearchParams({ address }), {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(response => {
      return response.json()
    }).then(data =>{
      setState(data[0])
    }).catch((err) => {
      console.log(err.message)
    })
  }
  
  const [reportAuditor, setReportAuditor] = useState('')
  const [challengeAuditor, setChallengeAuditor] = useState('')
  useEffect(() => {
    getData(report.auditor, setReportAuditor)
    getData(challenge.auditor, setChallengeAuditor)
  },[])

  return (
    <div>
      {report &&
      <Grid columns={2} divided style={{wordBreak: 'break-word'}}>
       <Grid.Column>
        <Header as='h4'>Report</Header> 
        <List>
          <List.Item>
            <span className='blue'>audit url: </span><a href={auditUrl}>{auditUrl}</a>
          </List.Item>
          <List.Item>
            <span className='blue'>auditor: </span>{reportAuditor?.name || report.auditor}
          </List.Item>
          <List.Item>
            <span className='blue'>report kind: </span>{report.kind}
          </List.Item>
          {report.vulnerabilities && 
          <List.Item>
            <span className='blue'>vulnerabilities: </span>
            {report.vulnerabilities?.map((vuln, i) => 
            <List.List key={i}>
              <List.Item>
                <span className='blue'>ID: </span>{i}.
              </List.Item>
              <List.Item>
                <span className='blue'>tool: </span>
                {report.vulnerabilities[i].tool}
              </List.Item>
              <List.Item>
                <span className='blue'>classification: </span>
                {report.vulnerabilities[i].classification}
              </List.Item>
              <List.Item>
                <span className='blue'>risk: </span>
                {report.vulnerabilities[i].risk}
              </List.Item>
              <List.Item>
                <span className='blue'>description: </span>
                {report.vulnerabilities[i].description}
              </List.Item>
            </List.List>
            )}
          </List.Item>
          }       

        </List>
      </Grid.Column>

      <Grid.Column>
        <Header as='h4'>Challenge</Header> 
        <List>
          <List.Item>
            <span className='blue'>audit url: </span><a href={auditUrl}>{auditUrl}</a>
          </List.Item>
          <List.Item>
            <span className='blue'>auditor: </span>{challengeAuditor?.name || challenge.auditor}
          </List.Item>
          <List.Item>
            <span className='blue'>state: </span>{challenge.state}
          </List.Item>
          {(challenge.removeVulnerabilities.length > 0)&& 
          <List.Item>
            <span className='blue'>Remove Vulnerabilities: </span>
            {(challenge.removeVulnerabilities.length > 0) && 
              challenge.removeVulnerabilities.map((vuln, i) => 
              <List.List key={i}>
                <List.Item>
                  <span className='blue'>Vulnerability ID: </span>
                  {challenge.removeVulnerabilities[i]}.
                </List.Item>
              </List.List>
            )}
          </List.Item>
          }
          {(challenge.addVulnerabilities.length > 0) && 
          <List.Item>
            <span className='blue'>Add Vulnerabilities: </span>
            {challenge.addVulnerabilities?.map((vuln, i) => 
            <List.List key={i}>
              <List.Item>
                <span className='blue'>tool: </span>
                {challenge.addVulnerabilities[i].tool}
              </List.Item>
              <List.Item>
                <span className='blue'>classification: </span>
                {challenge.addVulnerabilities[i].classification}
              </List.Item>
              <List.Item>
                <span className='blue'>risk: </span>
                {challenge.addVulnerabilities[i].risk}
              </List.Item>
              <List.Item>
                <span className='blue'>description: </span>
                {challenge.addVulnerabilities[i].description}
              </List.Item>
            </List.List>
            )}
          </List.Item>
          }
          {(challenge.patchVulnerabilities.length > 0) && 
          <List.Item>
            <span className='blue'>Patch Vulnerabilities: </span>
            {challenge.patchVulnerabilities?.map((vuln, i) => 
            <List.List key={i}>
              <List.Item>
                <span className='blue'>vulnerability Id: </span>
                {challenge.patchVulnerabilities[i].vulnerabilityId}.
              </List.Item>
              <List.Item>
                <span className='blue'>classification: </span>
                {challenge.patchVulnerabilities[i].classification}
              </List.Item>
              <List.Item>
                <span className='blue'>risk: </span>
                {challenge.patchVulnerabilities[i].risk}
              </List.Item>
              <List.Item>
                <span className='blue'>description: </span>
                {challenge.patchVulnerabilities[i].description}
              </List.Item>
            </List.List>
            )}
          </List.Item>
          }     
        </List>        
        { (challenge.state === 'Pending') &&
          <CreateProposal
            formState={props.formState} 
            setFormState={props.setFormState} 
            details={props.details}
          />
        }
      </Grid.Column>
    </Grid>
    }
  </div>
  )
}
