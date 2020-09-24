import React, {useState, useRef} from 'react'
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import './suggestion-form.css';

export const SuggestionForm = ({authToken}) => {
  const [showModal, setModalShow] = useState(false);
  const [isSuggestionSending, setSuggestionSending] = useState(false);
  const suggestionRef = useRef(null);

  // TODO: Move the fetch part to a diff file
  const submitPhrase = () => {
    console.log('submitPhrase called');
    const ROOTAPIURL = "http://127.0.0.1:3000"; //"https://rplbgv9ts3.execute-api.us-east-1.amazonaws.com/prod/";
    const url = `${ROOTAPIURL}/phrase`;

    const suggestedPhrase = suggestionRef && suggestionRef.current && suggestionRef.current.value;
    if (!suggestedPhrase) {
      console.log(' no phrase suggested');
      // TODO: validation handling here, spit back error to type something before submitting
    }

    const body = {
      phrase: suggestedPhrase
    };
  
    const options = {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        "Authorization": 'Bearer ' + authToken // TODO: this might be undefined, should try to make suggestionform not render unless authenticated
      }
    }
  
    setSuggestionSending(true);

    fetch(url, options)
      .then(res => res.json())
      .then(resJ => {
        console.log('submitPhrase response', resJ);
        setModalShow(false);
        setSuggestionSending(false);
        suggestionRef.current.value = null; // resets text
        // TODO: Trigger some sort of success modal
      });
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
        {sendingSpinner}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setModalShow(false)}>Cancel</Button>
        <Button onClick={() => submitPhrase()}>Confirm</Button>
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
