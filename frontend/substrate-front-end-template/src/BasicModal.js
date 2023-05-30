import React from "react";
import { Modal, Header, Button } from "semantic-ui-react";
import PropTypes from "prop-types";

export default function BasicModal(props) {
  const { modalValue, modalOpen, handleClose } = props

	const renderObject = function() {
    if (!modalValue?.content) return <p>No content yet</p>
		return Object.entries(modalValue?.content).map(([key, value], i) => {
			return (
				<p key={key}>
					{key}: {value}
				</p>
			)
		})
	}

  return (
    <Modal
      open={modalOpen}
      size="small"
      closeOnEscape={true}
      closeOnDimmerClick={true}
      onClose={handleClose}
    >
      <Header 
        as='h3' 
        style={{fontWeight: 'normal'}} 
        icon="browser" 
        content={modalValue.header} 
      />
      <Modal.Content>
        {renderObject()}
      </Modal.Content>
      <Modal.Actions>
        <Button color="blue" onClick={handleClose}>
          OK
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

BasicModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};
