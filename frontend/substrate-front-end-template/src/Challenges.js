import React,  { useEffect, useState } from 'react'
import { Segment, List, Header } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import ViewChallenge from './ViewChallenge'

export default function Challenges(props) {
  const { api, currentAccount } = useSubstrateState()
  const [auditHashes, setAuditHashes] = useState([])
  const [challenge, setChallenge] = useState('')

  useEffect(() => {
    const query = async () => {
      const challenges = await api.query.exoSys.challenges.entries()
      let challengedHashes =[]
      challenges.forEach(([key, value]) => {
        const hash = key.toHuman()[0] 
        challengedHashes.push(hash)
      });
      const hashes = [...new Set(challengedHashes)];
      setAuditHashes(hashes)
    }
    if (currentAccount) {
      query()
    } 
  }, [api, currentAccount])

  const [reportsState, setReportsState] = useState([])

  const getReportData = () => { 
    let auditReports = []
    auditHashes.forEach(auditHash => {
      const query = async () => {
        await api.query.exoSys.reports(
          auditHash,
          (result) => {                
            if (!result.isNone) {
              const res = JSON.parse(result.toString())
              res.forEach((report, index) => {
                report.auditHash = auditHash
                report.reportId = index
                const vulnQuery = async (auditHash, index) => {
                  await api.query.exoSys.vulnerabilities(
                  auditHash, index, 
                  (result) => {
                    const vulns = result.isNone ? null : result.toHuman();
                    Object.assign(report, { vulnerabilities: vulns })
                    auditReports.push(report)
                    setReportsState(auditReports.slice())
                  }
                )}
                vulnQuery(auditHash, index)
              })
            }
          }) 
        }
        query()
      })
    }

  useEffect(()=>{
    getReportData()
  },[auditHashes])

  const [challengesState, setChallengesState] = useState([])

  useEffect(() => {
    let challengeData = []
    reportsState.forEach(report => {
      const query = async (report) => {
        await api.query.exoSys.challenges(
          report.auditHash, report.reportId,
          (result) => { 
            if (result.isNone) return
            const res = result.toHuman()
            res.forEach((chall, index) => {
              chall.auditHash = report.auditHash
              chall.reportId = report.reportId
              chall.challengeId = index
              const existingIndex = challengeData.findIndex((elem) => {
                return (elem.auditHash === report.auditHash && 
                elem.reportId === report.reportId &&
                elem.auditor === chall.auditor)
              })
              if (existingIndex > -1) challengeData[existingIndex] = chall
              else challengeData.push(chall)
            }) 
            setChallengesState(challengeData.slice())
          })
        }
      if (currentAccount) {
        query(report)
      } 
    })
  }, [reportsState, currentAccount])

  const [auditState, setAuditState] = useState([])

  useEffect(() => {
    fetch('/lar/audit-requests', {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then(response => {
      return response.json()
    }
    ).then(data =>{
      setAuditState(data)
    }).catch((err) => {
      console.log(err.message)
    })
  },[])

  const [formState, setFormState] = useState({}) 

  const handleClick = (ch) => {
    setFormState({
      threshold: 1,
      proposal: '',
      hash: ch.auditHash,
      reportId: ch.reportId,
      challengeId: ch.challengeId,
      lengthBound: 5000
    })
    setChallenge(ch)
  }

  const [auditorNames, setAuditorNames] = useState([])
  useEffect(() => {
    challengesState.map((ch, i) => {
      const getData = async()=>{
        await fetch('/lar/auditor-data?' + new URLSearchParams({ address: ch.auditor }), {
          headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).then(response => {
          return response.json()
        }).then(data =>{
          const names = auditorNames.slice()
          names[i] = (data[0]).name
          setAuditorNames(names)
        }).catch((err) => {
          console.log(err.message)
        })
      }
      getData()
    })
  },[challengesState])

  const ChallengeTitles = () => {
    return challengesState.map((ch, i) => {
      const audit = auditState.find(a => a.hash === ch.auditHash)
      const auditorName = auditorNames[i]
      return ( 
        <List.Item key={i}>
          <List.Content onClick={() => handleClick(ch)}>
            <List.Header as='a' className='blue'>{audit?.projectUrl} / reportId: {ch.reportId}.</List.Header>
            <List.Description as='a'>Auditor: {auditorName || ch.auditor}</List.Description>
            <List.Description as='a'>State: {ch.state}</List.Description>
          </List.Content>
        </List.Item>
      )
    }) 
  }

  return (
    <div>
    <Segment>
      <Header as='h4'>List of challenges</Header> 
      <div className="selectBox" style={{maxHeight:"300px", border:'none'}}>
        <List divided relaxed style={{padding:"10px"}}>
          <ChallengeTitles />
        </List>
      </div>
    </Segment>
    {challenge  &&
      <Segment>
        <ViewChallenge 
          challenge={challenge}
          reports={reportsState}
          formState={formState}
          setFormState={setFormState}
          details={props.details}
          auditState={auditState}
        />
      </Segment>
    }
    </div>
  )
}