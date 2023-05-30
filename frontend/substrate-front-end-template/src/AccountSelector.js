import React, { useState, useEffect } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import {
  Menu,
  Button,
  Dropdown,
  Container,
  Icon,
  Image,
  Label,
} from 'semantic-ui-react'

import { useSubstrate, useSubstrateState } from './substrate-lib'

const CHROME_EXT_URL =
  'https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd'
const FIREFOX_ADDON_URL =
  'https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/'

const acctAddr = acct => (acct ? acct.address : '')

function Main(props) {
  const {
    setCurrentAccount,
    state: { keyring, currentAccount },
  } = useSubstrate()

  // Get the list of accounts we possess the private key for
  const keyringOptions = keyring.getPairs().map(account => ({
    key: account.address,
    value: account.address,
    text: account.meta.name.toUpperCase(),
    icon: 'user',
  }))

  const initialAddress =
    keyringOptions.length > 0 ? keyringOptions[0].value : ''

  // Set the initial address
  useEffect(() => {
    // `setCurrentAccount()` is called only when currentAccount is null (uninitialized)
    !currentAccount &&
      initialAddress.length > 0 &&
      setCurrentAccount(keyring.getPair(initialAddress))
  }, [currentAccount, setCurrentAccount, keyring, initialAddress])

  const onChange = addr => {
    setCurrentAccount(keyring.getPair(addr))
  }

  return (
    <div>
      {!currentAccount ? (
        <span>
          Create an account with Polkadot-JS Extension (
          <a target="_blank" rel="noreferrer" href={CHROME_EXT_URL}>
            Chrome
          </a>
          ,&nbsp;
          <a target="_blank" rel="noreferrer" href={FIREFOX_ADDON_URL}>
            Firefox
          </a>
          )&nbsp;
        </span>
      ) : null}
      <CopyToClipboard text={acctAddr(currentAccount)}>
        <Button
          basic
          circular
          size="large"
          icon="user"
          color={currentAccount ? 'green' : 'red'}
        />
      </CopyToClipboard>
      <Dropdown
        search
        selection
        clearable
        placeholder="Select an account"
        options={keyringOptions}
        onChange={(_, dropdown) => {
          onChange(dropdown.value)
        }}
        value={acctAddr(currentAccount)}
      />
    </div>
  )
}

function InMenu(props) {
  return (
    <Menu
      attached="top"
      tabular
      style={{
        backgroundColor: '#f7f7f7',
        border: 'none',
        paddingTop: '1em',
        paddingBottom: '1em',
        width: 'fit-content',
        marginLeft: 'auto',
        marginRight: 'auto', 
      }}
    >
      <Container>
        <Menu.Menu>
          <Image
            src={`${process.env.PUBLIC_URL}/assets/logo.png`}
            style={{ height: '50px' }}
          />
        </Menu.Menu>
        <Menu.Menu position="right" style={{ alignItems: 'center' }}>
          <Main {...props} />
          <BalanceAnnotation label={true} />
        </Menu.Menu>
      </Container>
    </Menu>
  )
}

export function BalanceAnnotation(props) {
  const { api, currentAccount } = useSubstrateState()
  const [accountBalance, setAccountBalance] = useState(0)
  const [balanceString, setBalanceString] = useState(0)

  // When account address changes, update subscriptions
  useEffect(() => {
    let unsubscribe

    // If the user has selected an address, create a new subscription
    currentAccount &&
      api.query.system
        .account(acctAddr(currentAccount), balance => {
          setAccountBalance(balance.data.free.toHuman())
          setBalanceString(balance.data.free.toString())
        })
        .then(unsub => (unsubscribe = unsub))
        .catch(console.error)

    return () => unsubscribe && unsubscribe()
  }, [api, currentAccount])

  const mUnitBalance = (+(+balanceString / 100000).toFixed()).toLocaleString('en-US')

  return currentAccount ? (
    props.label ? 
    <Label pointing="left">
      <Icon name="money" color="green" />
      {accountBalance}
    </Label>
    :
    <span title={accountBalance + ' QRD'}>{mUnitBalance} mQRD</span>
  ) : null
}

export function AccountSelector(props) {
  const { api, keyring } = useSubstrateState()
  return keyring.getPairs && api.query ? <Main {...props} /> : null
}

export function AccountSelectorMenu(props) {
  const { api, keyring } = useSubstrateState()
  return keyring.getPairs && api.query ? <InMenu {...props} /> : null
}
