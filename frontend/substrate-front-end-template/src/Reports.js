import { useState, useEffect, useRef } from 'react'
import { Grid, Container, Table, List, Header } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import AuditList from './AuditList'
import ChallengeReportButton from './ChallengeReportButton'

export default function Reports(props) {
  const { api, currentAccount } = useSubstrateState()

  const [auditData, setAuditData] = useState([])
  const [auditsChange, setAuditsChange] = useState('')
  const [reports, setReports] = useState([])
  const [showAudit, setShowAudit] = useState('')
  const unsubAll = []
  const auditDetails = []

  const getData=()=>{
    fetch('/audit-requests', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      return response.json()
    }
    ).then(data =>{
      data.forEach(audit => {
        const query = async (auditHash) => {
          await api.query.exoSys.reports(
            auditHash,
            (result) => {                
              const auditClone = {...audit}
              if (!result.isNone) {
                const reports = JSON.parse(result.toString())
                if (reports.length) {
                  Object.assign(auditClone, { reports })
                  const existingIndex = auditDetails.findIndex((elem) => 
                    Object.values(elem).includes(auditHash))
                  if (existingIndex > -1) auditDetails[existingIndex] = auditClone
                  else auditDetails.push(auditClone)
                }
              }
              setAuditData(auditDetails.slice())
              }) 
          .then(unsub => unsubAll.push(unsub))
        }
        query(audit.hash)
      })
    }).catch((err) => {
      console.log(err.message)
    })
  }

const setReportData = (auditData) => {
  auditData.forEach((audit => { 
    const completeAudit = {...audit}
    let totalReports = []
    completeAudit.reports.forEach((report, reportId) => {
      const query2 = async (auditHash, reportId) => {
        await api.query.exoSys.vulnerabilities(
          auditHash, reportId,
          (result) => {                
            if (!result.isNone) {
              const vulns = result.toHuman();
              const completeReport = Object.assign({}, report, { vulnerabilities: vulns })
              totalReports[reportId] = completeReport
              setReports({[audit.hash] : totalReports.slice()})
            }
          } 
        )
      }
      query2(audit.hash, reportId)
    })
  }))
}  

  const initialRender = useRef(true);
  useEffect(()=>{
    if (initialRender.current) {
      getData()
      initialRender.current = false;
    } else {
      setTimeout(() => {
        getData()
      }, 1000)
    }
  },[auditsChange])

  const handleChange = null

  useEffect(()=>{
    setAuditsChange(currentAccount?.address)
  },[currentAccount])

  useEffect(()=>{
    setReportData(auditData)
  },[auditData])

  const audits = auditData.filter(a =>
    a.manualReport && a.manualReport !== 'In progress')

  const onAuditClick = function(audit) {
    setShowAudit(audit)
  }

  const auditHash = showAudit?.hash

  return (
    <Grid>
      <Container>
        <br></br>
        <p>You can view the details of the audit and its report by clicking on the item.</p>
      </Container>
      <Grid.Column width={6} className='auditorColumn'>
        <AuditList 
          auditData={audits}
          handleClick={handleChange} 
          auditsChange={auditsChange}
          onClick={onAuditClick}
          />
      </Grid.Column>
      <Grid.Column width={10}>
        <div>
          {showAudit && 
            <div>
              <Table>  
                <Table.Body>
                  <Table.Row>
                    <Table.Cell>Project Url</Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-word' }}>
                      {showAudit.projectUrl}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>State</Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-word' }}>
                      {showAudit.state}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Auto Report</Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-word' }}>
                      {showAudit.autoReport}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Manual Report</Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-word' }}>
                      {showAudit.manualReport}
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>

            <Header color='blue' as='h4'>Reports</Header> 
            { reports[auditHash].map((rep, index) => 
              <Table style={{ wordBreak: 'break-word' }} key={index}>  
                <Table.Body>
                  <Table.Row>
                    <Table.Cell collapsing>auditor</Table.Cell>
                    <Table.Cell colSpan='2'>
                      {rep.auditor}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>kind</Table.Cell>
                    <Table.Cell colSpan='2'>
                      {rep.kind}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell colSpan='3'>vulnerabilities</Table.Cell>
                  </Table.Row>

                { rep.vulnerabilities.map((vuln,i) => 
                  <Table.Row key={i}>
                    <Table.Cell>{i}</Table.Cell>
                    <Table.Cell colSpan='2'>                      
                      <List>
                        <List.Item>
                          <List.Content>
                            <List.Header>tool</List.Header>
                            <List.Description>
                              {vuln.tool}
                            </List.Description>
                          </List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Content>
                            <List.Header>classification</List.Header>
                            <List.Description>
                              {vuln.classification}  
                            </List.Description>
                          </List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Content>
                            <List.Header>risk</List.Header>
                            <List.Description>
                              {vuln.risk}
                            </List.Description>
                          </List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Content>
                            <List.Header>description</List.Header>
                            <List.Description>
                              {vuln.description}
                            </List.Description>
                          </List.Content>
                        </List.Item>
                      </List>
                    </Table.Cell>
                  </Table.Row>
                )}
                  <Table.Row>
                    <Table.Cell colSpan='3' textAlign='right' >
                      <ChallengeReportButton 
                        auditHash={auditHash} 
                        report={rep} 
                        reportId={index}
                      />
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
              )}
            </div>
          }
        </div>
      </Grid.Column>
    </Grid>
  )
}