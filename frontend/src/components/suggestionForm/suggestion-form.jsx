import React, {useState, useRef} from 'react'
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';

import './suggestion-form.css';

import { sendPhrase, FAILED_TO_SEND } from '../../dataclient/dataclient';

export const SuggestionForm = ({authToken}) => {
  const [showModal, setModalShow] = useState(false);
  const [isSuggestionSending, setSuggestionSending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const suggestionRef = useRef(null);

  const submitPhrase = async () => {

    const suggestedPhrase = suggestionRef?.current?.value;
    if (!suggestedPhrase) {
      console.log('no phrase suggested');
      //TODO: validation handling here, spit back error to type something before submitting
    }

    setSuggestionSending(true);

    const {data, error} = await sendPhrase(suggestedPhrase, authToken);

    if (!!data) { // Success
      // Close modal and reset sending states
      setModalShow(false);
      setSuggestionSending(false);
      setShowToast(true);
      suggestionRef.current.value = null; // resets text
    } else { // Error
      console.log('Failed to sendPhrase');
      // TODO: Show error
    }
  }

  const suggestionForm = (
    <Form>
      <Form.Group controlId="suggestionForm">
        <Form.Label as='h3' className='text-center header'>Say Something Random</Form.Label>
        <Form.Control as="textarea" rows="3" placeholder="Enter your suggestion" ref={suggestionRef} />
      </Form.Group>
    </Form>
  );

  const sendSuggestionButton = (
    <Button block onClick={() => setModalShow(true)} >
      Send suggestion
    </Button>
  );

  const sendingSpinner = isSuggestionSending && (
    <Spinner animation="border">
      <span className='sr-only'>Loading...</span>
    </Spinner>
  );

  const confirmationModalBodyText = !isSuggestionSending && (
    <React.Fragment>
      Once you send, you won't be able to edit the message.
      There is no guarentee the streamer will read your message.
      REWORD
    </React.Fragment>
  )

  const sendConfirmationModal = (
    <Modal
      size="sm"
      show={showModal}
      onHide={() => setModalShow(false)}
      animation={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>Are you sure you want to send?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {confirmationModalBodyText}
        {sendingSpinner}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setModalShow(false)}>Cancel</Button>
        <Button onClick={() => submitPhrase()}>Confirm</Button>
        {/* Show TOAST on success popup from bottom */}
      </Modal.Footer>
    </Modal>
  );

  const toastNotification = (
    <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
      <Toast.Header>Success!</Toast.Header>
      <Toast.Body>Message successfully sent.</Toast.Body>
    </Toast>
  );

  return (
    <React.Fragment>
      {suggestionForm}
      {sendSuggestionButton}
      {sendConfirmationModal}
      {toastNotification}
    </React.Fragment>
  );
};
