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

  const suggestionForm = !isSuggestionSending && !isSuccessfulSend && (
    <Form>
      <Form.Group controlId="suggestionForm">
        <Form.Label as='h3' className='text-center header'>Say Something Random</Form.Label>
        <Form.Control as="textarea" rows="3" placeholder="Enter your suggestion" ref={suggestionRef} />
      </Form.Group>
    </Form>
  );

  const infoText = !isSuggestionSending && !isSuccessfulSend && (
    <em>
      Note: There is no guarantee that the streamer will use your suggestion.
    </em>
  );

  const successMessage = isSuccessfulSend && (
    <div>
      <CheckCircleFill color={'green'} size={'100px'}></CheckCircleFill>
      <p> Suggestion successfully sent!</p>
    </div>
  );

  const sendSuggestionButton = !isSuccessfulSend && (
    <Button block onClick={() => onClickSend()} disabled={isSuggestionSending} >
      Send suggestion
    </Button>
  );

  const sendingSpinner = isSuggestionSending && (
    <Spinner animation="border">
      <span className='sr-only'>Loading...</span>
    </Spinner>
  );

  const postAnotherButton = isSuccessfulSend && (
    <Button variant="primary" onClick={() => resetState()}>
      Post Another
    </Button>
  );

  return (
    <React.Fragment>
      {suggestionForm}
      {infoText}
      {sendingSpinner}
      {successMessage}
      {postAnotherButton}
      {sendSuggestionButton}
    </React.Fragment>
  );
};
