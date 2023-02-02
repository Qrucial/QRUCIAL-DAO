import React, { createRef } from 'react'
import {
  Container,
  Dimmer,
  Loader,
  Grid,
  Sticky,
  Message,
} from 'semantic-ui-react'
import 'semantic-ui-less/semantic.less'
import { Toaster } from 'react-hot-toast'

import { SubstrateContextProvider, useSubstrateState } from './substrate-lib'
import { DeveloperConsole } from './substrate-lib/components'
import bgImage from '/public/assets/dot_background.png'


import AccountSelector from './AccountSelector'
import Signup from './Signup'
import AuditorProfile from './AuditorProfile'

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
          negative
          compact
          floating
          header="Error Connecting to Substrate"
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
      <Sticky context={contextRef}>
        <AccountSelector />
      </Sticky>
      <Container>
        <Grid stackable columns="equal">
          <Grid.Row>
            <Signup />
          </Grid.Row>
          <Grid.Row>
            <AuditorProfile />
          </Grid.Row>
        </Grid>
      </Container>
      <DeveloperConsole />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 7000,
          style: {
            background: '#fbfdef',
            color: 'rgba(0, 0, 0, 0.87)',
          }
        }}
      />
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
