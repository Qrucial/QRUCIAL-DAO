import React from 'react'
import { Container, Segment, Header } from 'semantic-ui-react'

export default function About(props) {
  return (
    <Container>
      <Segment raised style={{background: '#f7f7f7'}}>
        <Header color='blue' as='h3'>Introduction</Header> 
        <div>
          <p>QRUCIAL DAO is a web3 security toolsuite and reputation system. Currently the project is in beta test mode.</p>
          <p>Why? We find it ironic that web3 and trustless systems are trusting web2 auditors and legacy security companies to protect them from threat actors. This is the reason we want to build
            a system in which the community and the projects can trust that quality work in fact has been done.</p>
          <p>For instance, no one verifies that the right tools have been used for the job or that the auditor performing the task is experienced enough.
            Our project provides you a transparent on chain solution to this problem. We provide a transparent system where it is clear who did a thorough audit and who did shallow work.</p>
          <p>All audit reports are bound to the audited project packages themselves and results are verifiable and transparent. Audit reports can be challenged, so the better hackers can steal the reputation of others.</p>
          <Header color='blue' as='h3'>Request audit</Header>
          <p>Get QRD and request an automated audit, tools will run automatically. And someone might even do a free test audit for you in this beta instance, just for fun.</p>
          <button primary onclick="window.location.href='/requestor';">-></button>
          <Header color='blue' as='h3'>Become an auditor</Header> 
          <p>Right now, in this test instance, anyone can "hack" him/herself to become an auditor. In the live system we'll add those who already proved their skills through CTF games, eg. CCTF.</p>
          <button primary onclick="window.location.href='/auditor';">-></button>
          <Header color='blue' as='h3'>Become council member</Header> 
          <p>Council members overview the audit challenges and help the QDAO system to be fair play. Become a council member by hacking the beta system or asking on matrix.</p>
        </div>  
      </Segment>
    </Container>
  )
}
