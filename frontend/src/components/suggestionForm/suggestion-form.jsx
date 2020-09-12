import React, {useState} from 'react'
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import './suggestion-form.css';

export const SuggestionForm = () => {
  const [showModal, setModalShow] = useState(false);

  const suggestionForm = (
    <Form>
      <Form.Group controlId="suggestionForm">
        <Form.Label as='h3' className='text-center header'>Say Something Random</Form.Label>
        <Form.Control as="textarea" rows="3" placeholder="Enter your suggestion" />
      </Form.Group>
    </Form>
  );

  const sendSuggestionButton = (
    <Button block onClick={() => setModalShow(true)} >
      Send suggestion
    </Button>
  );

  const sendConfirmationModal = (
    <Modal
      size="sm"
      show={showModal}
      onHide={() => setModalShow(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>Are you sure you want to send?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Once you send, you won't be able to edit the message.
        There is no guarentee the streamer will read your message.
        REWORD
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setModalShow(false)}>Cancel</Button>
        <Button>Confirm</Button>
        {/* Show TOAST on success popup from bottom */}
      </Modal.Footer>
    </Modal>
  );

  return (
    <React.Fragment>
      {suggestionForm}
      {sendSuggestionButton}
      {sendConfirmationModal}
    </React.Fragment>
  );
};
