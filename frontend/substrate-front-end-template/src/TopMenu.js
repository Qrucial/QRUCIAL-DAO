import React from 'react'
import { NavLink } from 'react-router-dom';
import { Menu, Container, Image } from 'semantic-ui-react'

export default function TopMenu() {
  return (      
    <Container >
      <Menu
        attached="top"
        secondary
        pointing
        style={{
          backgroundColor: '#f7f7f7',
          border: 'none',
          paddingTop: '0.5em',
          paddingBottom: '0.5em'
        }}
      >
        <Menu.Menu>
          <NavLink to="/">
            <Image
              src={`${process.env.PUBLIC_URL}/assets/logo.png`}
              style={{ height: '50px' }}
            />
          </NavLink>
        </Menu.Menu>
          <Menu.Menu position="right" style={{ alignItems: 'center' }}>
          <Menu.Item as={NavLink} to='/about' content='Get started' />
          <Menu.Item as={NavLink} to='/requestor' content='Start audit' />
          <Menu.Item as={NavLink} to='/auditor' content='Audits' />
          <Menu.Item as={NavLink} to='/council' content='Council' />  
        </Menu.Menu>
      </Menu>
    </Container>
  )
}
