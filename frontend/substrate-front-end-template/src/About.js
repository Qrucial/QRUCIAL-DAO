import React from 'react'
import { Container, Segment, Header } from 'semantic-ui-react'

export default function About(props) {
  return (
    <Container>
      <Segment raised style={{background: '#f7f7f7'}}>
        <Header color='blue' as='h3'>About</Header> 
        <div>
          <p>QRUCIAL DAO is a system for trustless audits, and certification using non-transferable NFTs,
            exogenous tooling and decentralized Consensus.</p>
          <p>To us, it is ironic that web3 and trustless systems are trusting
            web2 auditors and legacy security companies to protect
            them from threat actors. This is the reason we want to build
            a system in which the community and the projects can trust
            that the work in fact has been done. Often, security audits
            of web3 projects are performed in a way that relies on in
            transparency and a blind trust in a company logo.</p>
          <p>For example, no one verifies that the right tools have been
            used for the job or that the auditor performing the task is
            knowledgeable enough to perform the work professionally.
            Our project provides you a transparent on chain solution to
            this. We provide on chain tools which are developed by Qrucial as well as the community to test your project in a transparent and scalable way.
            After this phase, you can choose from a pool of verified auditors who already proved their skills in on chain CTFs and
            through our on chain reputation system.</p>
          <p>In the end you get the report as non-transferable NFT which
            is bound to the audited smart contract itself and therefore
            verifiable and transparent.</p>
        </div>
      </Segment>
    </Container>
  )
}
