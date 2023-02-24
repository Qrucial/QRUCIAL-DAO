import { Icon, Button } from 'semantic-ui-react'
import toast from 'react-hot-toast'

export const toastContent = (t, text) => {
  return (
    <span>
      <Button 
        size='tiny' 
        basic 
        style={{padding: '0.5em', float: 'right'}}
        onClick={() => toast.dismiss(t.id)}>
        <Icon fitted name='close' />
      </Button>
      {text}&ensp;
    </span>
)}