import { Icon, Button } from 'semantic-ui-react'
import toast from 'react-hot-toast'

const toastContent = (t, text) => {
  return (
    <div>
      <Button 
        size='tiny' 
        basic 
        style={{padding: '0.35em', float: 'right', margin: 0}}
        onClick={() => toast.dismiss(t.id)}>
        <Icon fitted name='close' />
      </Button>
      {text}&ensp;
    </div>
)}

export function createToast() {
  let toastId
  function showToast(status) {
    if (toastId) {
      toast(((t) => toastContent(t, status)),{ id: toastId });
      if (status?.includes('Finalized') || status?.includes('Failed')) { 
        toastId = null
      }
    } else {
      const newToastId = toast((t) => toastContent(t, status));
      toastId = newToastId
    }
  }
  return showToast;
}