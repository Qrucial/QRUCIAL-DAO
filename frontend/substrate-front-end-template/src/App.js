import React, { createRef } from 'react'
import {
  Container,
  Dimmer,
  Loader,
  Grid,
  Sticky,
  Message,
  Divider,
} from 'semantic-ui-react'
import 'semantic-ui-less/semantic.less'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'

import { SubstrateContextProvider, useSubstrateState } from './substrate-lib'
import { DeveloperConsole } from './substrate-lib/components'
import bgImage from '/public/assets/dot_background.png'

import { AccountSelector } from './AccountSelector'
import AuditorsPage from './AuditorsPage'
import Home from './Home'
import TopMenu from './TopMenu'
import CouncilPage from './CouncilPage'
import About from './About'
import Requestor from './Requestor'

function Main() {
  const { apiState, apiError, keyringState } = useSubstrateState()

  const loader = text => (
    <Dimmer active>
      <Loader size="small">{text}</Loader>
    </Dimmer>
  )

  const message = errObj => (
    <Grid centered columns={2} padded>
      <Grid.Column>
        <Message
          color="blue"
          compact
          floating
          header="Waiting for connection"
          content={`Connection to websocket '${errObj.target.url}' failed.`}
        />
      </Grid.Column>
    </Grid>
  )

  if (apiState === 'ERROR') return message(apiError)
  else if (apiState !== 'READY') return loader('Connecting to Substrate')

  if (keyringState !== 'READY') {
    return loader(
      "Loading accounts (please review any extension's authorization)"
    )
  }

  const contextRef = createRef()

  return (
    <div ref={contextRef}
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat:"no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        minHeight: "100%"
      }}>
      <div className="content-container">
        <BrowserRouter>
          <Sticky context={contextRef}>
            <TopMenu />
          </Sticky>
          <Container style={{marginTop:'2em'}}>
            <Routes>
              <Route exact path='/' element={<Home />}></Route>
              <Route exact path='/lar' element={<Home />}></Route>
              <Route exact path='/lar/about' element={<About />}></Route>
              <Route exact path='/lar/requestor' element={<Requestor /> }></Route>
              <Route exact path='/lar/auditor' element={<AuditorsPage /> }></Route>
              <Route exact path='/lar/council' element={<CouncilPage /> }></Route>
            </Routes>
          </Container>
          <DeveloperConsole />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 7000,
              style: {
                background: '#fbfdef',
                color: 'rgba(0, 0, 0, 0.87)',
                wordBreak: 'break-word',
              },
              error: {
                duration: 10000,
                style: {
                  background: '#ffe8e6',
                  color: '#db2828',
                  boxShadow: '0 0 0 1px #db2828',
                },
              }
            }}
          />
        </BrowserRouter>
      </div>
      
      <footer className="footer">
        <Divider fitted ></Divider>
        <Container>
          <Grid style={{margin: 0}}> 
            <Grid.Row>  
              <Grid.Column width={8}>
                <a target='blank' 
                  href='https://github.com/Qrucial/QRUCIAL-DAO/blob/main/docs/QRUCIAL_DAO_Whitepaper.pdf'>
                  Whitepaper
                </a>
                <br/>
                <a target='blank' 
                  href='https://github.com/Qrucial/QRUCIAL-DAO/wiki'>
                  Wiki
                </a>
              </Grid.Column>
              <Grid.Column textAlign='right' width={8}>
                <AccountSelector />
              </Grid.Column>
            </Grid.Row> 
          </Grid>
        </Container>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <SubstrateContextProvider>
      <Main />
    </SubstrateContextProvider>
  )
}
