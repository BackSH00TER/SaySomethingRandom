import React, {useEffect, useState, useRef} from 'react'
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';

import { IS_DEV_MODE } from '../../util/constants';

import './suggestion-form.css';

import { sendPhrase, FAILED_TO_SEND } from '../../dataclient/dataclient';

export const SuggestionForm = ({authToken}) => {
  const [showModal, setModalShow] = useState(false);
  const [isSuggestionSending, setSuggestionSending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const suggestionRef = useRef(null);
  const twitch = window.Twitch ? window.Twitch.ext : null;
  
  /**
   * Steps for transacting bits
   * 1. Get selected productSku - (hardcoded for now)
   * 2. On click of Submit
   * 2a. Call useBits(productSku) - kicks of twitch bits transaction flow (including if they need to purchase more bits, log in, etc)
   * 2aa. Should also have its own confirmation modal (if so remove mine)
   * 3. On confirmation, listen to twitch.bits.onTransactionComplete((transaction) => {...})
   * 4. Get transaction item, and call postPhrase endpoint w/ transaction attached
   * 5. On backend - verify transaction.transactionReceipt (jwt) is valid before adding to DB
   * 5a. Make sure to respond with error/fail if jwt was not valid for some reason
   * 6. Then use our own jwt to send to pubsub? (optional that it is doing)
   */

  const productSku = "submit_suggestion_100"; // TODO: get from config service once it is set up

  // Begins the bits transaction flow
  const startTransaction = async (suggestedPhrase) => {
    console.log('startTransaction called');
    if (!productSku) {
      // TODO: err handling
      console.log('No sku received, what product to use, throw err, prevent further actions');
    }

    if (twitch) {
      // TODO: setUseLoopback(true) skips the useBits and returns after 1.5
      // TODO: fails to go through the bit transacation flow locally, might just have to test this one a test channel??
      IS_DEV_MODE && twitch.bits.setUseLoopback(true); // TODO: only do this if in debug mode while running locally
      twitch.bits.useBits(productSku);

      // console.log('isbitsenabled', twitch.features.isBitsEnabled); // not sure why this alwasy retursn false, maybe b/c its locally test?

      twitch.bits.onTransactionComplete((transaction) => {
        console.log('onTransactionComplete() called, received transaction:', transaction);
        submitPhrase(suggestedPhrase, transaction);
      });
    
      twitch.bits.onTransactionCancelled((transaction) => {
        console.log('onTransactiononTransactionCancelled()) called, received transaction:', transaction);
      });
    }
  };

  


  const onClickSend = async () => {
    console.log('onclicksend')
    const suggestedPhrase = suggestionRef?.current?.value;
    if (!suggestedPhrase) {
      console.log('no phrase suggested');
      //TODO: validation handling here, spit back error to type something before submitting
    }

    setSuggestionSending(true);

    await startTransaction(suggestedPhrase);
  };

  const submitPhrase = async (suggestedPhrase, transaction) => {
    console.log('submitphrase')
    const {data, error} = await sendPhrase(suggestedPhrase, transaction, authToken);

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
        <Button onClick={() => onClickSend()}>Confirm</Button>
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
