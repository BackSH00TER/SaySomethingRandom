import React, {useState, useRef} from 'react'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import { CheckCircleFill } from 'react-bootstrap-icons';

import { sendPhrase, FAILED_TO_SEND } from '../../dataclient/dataclient';
import { IS_DEV_MODE } from '../../util/constants';

import './suggestion-form.css';

export const SuggestionForm = ({authToken}) => {
  const [isSuggestionSending, setSuggestionSending] = useState(false);
  const [isSuccessfulSend, setSuccessfulSend] = useState(false);
  const suggestionRef = useRef(null);
  const twitch = window.Twitch ? window.Twitch.ext : null;

  const productSku = "submit_suggestion_100"; // TODO: get from config service once it is set up

  // ----- ACTIONS ------
  // Begins the bits transaction flow
  const startTransaction = async (suggestedPhrase) => {
    if (!productSku) {
      // TODO: err handling
      console.log('No sku received, what product to use, throw err, prevent further actions');
    }

    if (twitch) {
      /**
       * To locally test the bits transaction flow you must call twitch.bits.setUseLoopback(true).
       * This will skip twitch's modal flow when twitch.bits.useBits(sku) is called and returns true after a 1.5 second timeout
       */
      IS_DEV_MODE && twitch.bits.setUseLoopback(true);
      twitch.bits.useBits(productSku);

      // TODO: Add a check for twitch.features.isBitsEnabled - note currently it always returns false

      twitch.bits.onTransactionComplete((transaction) => {
        console.log('onTransactionComplete() called, received transaction:', transaction);
        submitPhrase(suggestedPhrase, transaction);
      });
    
      twitch.bits.onTransactionCancelled((transaction) => {
        console.log('onTransactiononTransactionCancelled()) called, received transaction:', transaction);
        // TODO: if user cancels, need to stop the spinner, and reset
      });
    }
  };

  const onClickSend = async () => {
    const suggestedPhrase = suggestionRef?.current?.value;
    if (!suggestedPhrase) {
      console.log('no phrase suggested');
      //TODO: validation handling here, spit back error to type something before submitting
    }

    setSuggestionSending(true);

    await startTransaction(suggestedPhrase);
  };

  const submitPhrase = async (suggestedPhrase, transaction) => {
    const {data, error} = await sendPhrase(suggestedPhrase, transaction, authToken);

    if (!!data) { // Success - Reset sending state and mark as success
      setSuggestionSending(false);
      setSuccessfulSend(true);
      // suggestionRef.current.value = null; // resets text
    } else { // Error
      console.log('Failed to sendPhrase');
      // TODO: Show error
    }
  };

  const resetState = () => {
    setSuggestionSending(false);
    setSuccessfulSend(false);
  };

  // ----- COMPONENTS ------

  const header = (
    <h3 className='text-center'>Say Something Random</h3>
  );

  const suggestionForm = !isSuggestionSending && !isSuccessfulSend && (
    <Form>
      <Form.Group controlId="suggestionForm">
        <Form.Label>Suggestion:</Form.Label>
        <Form.Control
          as="textarea"
          rows="5"
          placeholder="Enter your suggestion"
          ref={suggestionRef}
          aria-describedby="suggestionFormHelpBlock"
        />
        <Form.Text id="suggestionFormHelpBlock" muted>
          Your suggestion must be less than 300 characters and follow Twitch TOS. All transactions are final.
        </Form.Text>
      </Form.Group>
    </Form>
  );

  const successMessage = isSuccessfulSend && (
    <div className='text-center success-message'>
      <CheckCircleFill color={'green'} size={'100px'}></CheckCircleFill>
      <p> Suggestion successfully sent!</p>
    </div>
  );

  const sendSuggestionButton = !isSuccessfulSend && !isSuggestionSending && (
    <Button
      className='send-button text-center'
      block
      onClick={() => onClickSend()}
    >
      Send suggestion
    </Button>
  );

  const sendingSpinner = isSuggestionSending && (
    <div className='spinner-container'>
      <Spinner animation="border" className='sending-spinner'>
        <span className='sr-only'>Saving...</span>
      </Spinner>
      <div className='text-center'>Saving ...</div>
    </div>
  );

  const postAnotherButton = isSuccessfulSend && (
    <Button
      className='post-another-button'
      variant="primary"
      onClick={() => resetState()}
    >
      Post Another
    </Button>
  );

  return (
    <React.Fragment>
      <div className='header-region'>
        {header}
      </div>
      <div className='form-region'>
        {suggestionForm}
        {sendingSpinner}
        {successMessage}
        {postAnotherButton}
      </div>
      <div className='footer-region'>
        {sendSuggestionButton}
      </div>
    </React.Fragment>
  );
};
