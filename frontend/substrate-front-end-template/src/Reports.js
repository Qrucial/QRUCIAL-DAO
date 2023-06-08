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
  const [shownAudit, setShownAudit] = useState('')
  const unsubAll = []
  const auditDetails = []

  const getData=()=>{
    fetch('/lar/audit-requests', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      if (!response.ok) {
        throw Error(response.status + ' ' + response.statusText)
      }
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
  let totalReports = []
  auditData.forEach((audit => { 
    let auditsReports = []
    audit.reports.forEach((report, i) => {
      const query2 = async (auditHash, reportId) => {
        await api.query.exoSys.vulnerabilities(
          auditHash, reportId,
          (result) => {  
            const vulns = result.isNone ? null : result.toHuman()
            auditsReports[reportId] = Object.assign({}, report, { reportId, vulnerabilities: vulns })
            const auditReportsRecord = { auditHash: auditHash, reports : auditsReports }
            const existingIndex = totalReports.findIndex((elem) => 
              Object.values(elem).includes(auditHash))
            if (existingIndex > -1) totalReports[existingIndex] = auditReportsRecord
            else totalReports.push(auditReportsRecord)
            setReports(totalReports.slice())
          } 
        )
      }
      query2(audit.hash, i)
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

  const audits = auditData

  const onAuditClick = function(audit) {
    setShownAudit(audit)
  }

  const auditHash = shownAudit?.hash
  const reportsOfAudit = auditHash ? 
    reports.find(elem => elem.auditHash === auditHash)?.reports
    : []
    
  return (
    <Grid>
      <Container>
        <br></br>
        <p>You can view the details of the audit and its report by clicking on the item.</p>
      </Container>
      <Grid.Column width={6} className='auditorColumn'>
        {(reports.length > 0) && 
        <AuditList 
          auditData={audits}
          handleClick={handleChange} 
          auditsChange={auditsChange}
          onClick={onAuditClick}
          />
        }
      </Grid.Column>
      <Grid.Column width={10}>
        <div>
          {shownAudit && 
            <div>
              <Table>  
                <Table.Body>
                  <Table.Row>
                    <Table.Cell>Project Url</Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-word' }}>
                      <a href={shownAudit.projectUrl}>{shownAudit.projectUrl}</a>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>State</Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-word' }}>
                      {shownAudit.state}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Auto Report</Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-word' }}>
                      {shownAudit.autoReport}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Manual Report</Table.Cell>
                    <Table.Cell style={{ wordBreak: 'break-word' }}>
                      {shownAudit.manualReport}
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>

            <Header color='blue' as='h4'>Reports</Header> 
            { reportsOfAudit?.map((rep, index) => 
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
                { rep.vulnerabilities &&
                  <Table.Row>
                    <Table.Cell colSpan='3'>vulnerabilities</Table.Cell>
                  </Table.Row>
                }
                { rep.vulnerabilities?.map((vuln,i) => 
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
                {(rep.auditor !== currentAccount.address) &&                  
                  <Table.Row>
                    <Table.Cell colSpan='3' textAlign='right' >
                      <ChallengeReportButton 
                        auditHash={auditHash} 
                        report={rep} 
                        reportId={rep.reportId}
                      />
                    </Table.Cell>
                  </Table.Row>
                }
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