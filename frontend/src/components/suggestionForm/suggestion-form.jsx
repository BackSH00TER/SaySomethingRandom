import React, {useState, useRef} from 'react'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import { CheckCircleFill } from 'react-bootstrap-icons';

import { sendPhrase, FAILED_TO_SEND } from '../../dataclient/dataclient';
import { IS_DEV_MODE } from '../../util/constants';

import './suggestion-form.css';

export const SuggestionForm = ({authToken, productSku}) => {
  const [isSuggestionSending, setSuggestionSending] = useState(false);
  const [isSuccessfulSend, setSuccessfulSend] = useState(false);
  const [isTransactionPending, setTransactionPending] = useState(false);
  const [validationMessage, setValidationMessage] = useState({isValid: true, message: ''});
  const suggestionRef = useRef(null);
  const twitch = window.Twitch ? window.Twitch.ext : null;
  
  const selectedProductSku = productSku || "submit_suggestion_100";
  console.log('productSku', productSku, 'selectedproductsku', selectedProductSku);

  // ----- ACTIONS ------
  // Begins the bits transaction flow
  const startTransaction = async (suggestedPhrase) => {
    if (!selectedProductSku) {
      // TODO: err handling
      console.log('No sku received, what product to use, throw err, prevent further actions');
    }

    if (twitch) {
      /**
       * To locally test the bits transaction flow you must call twitch.bits.setUseLoopback(true).
       * This will skip twitch's modal flow when twitch.bits.useBits(sku) is called and returns true after a 1.5 second timeout
       */
      IS_DEV_MODE && twitch.bits.setUseLoopback(true);
      twitch.bits.useBits(selectedProductSku);

      // TODO: Add a check for twitch.features.isBitsEnabled - note currently it always returns false

      twitch.bits.onTransactionComplete((transaction) => {
        console.log('onTransactionComplete() called, received transaction:', transaction);
        submitPhrase(suggestedPhrase, transaction);
      });
    
      twitch.bits.onTransactionCancelled((transaction) => {
        console.log('onTransactiononTransactionCancelled()) called, received transaction:', transaction);
        resetState();
      });
    }
  };

  const onClickSend = async () => {
    const suggestedPhrase = suggestionRef?.current?.value;

    const isValid = isContentValid(suggestedPhrase);
    if (!isValid) {
      console.log("content not valid so breaking early")
      return;
    }

    setTransactionPending(true);
    await startTransaction(suggestedPhrase);
  };

  const submitPhrase = async (suggestedPhrase, transaction) => {
    setSuggestionSending(true);

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
    setTransactionPending(false);
  };

  const onChangeForm = () => {
    if (validationMessage.isValid) {
      // If the message already valid don't do anything
      return;
    }

    const suggestedPhrase = suggestionRef?.current?.value;
    if (!!suggestedPhrase) {
      // If we have a phrase clear the validation
      setValidationMessage({
        isValid: true,
        message: 'Your suggestion is valid.'
      });
    }
  }

  // Client side validation of content meets requirements
  // - No empty phrase
  // - 300 characters max
  // - no TOS breakage (Future)
  // TODO: need to have an onChange w/ debounce that fires to update to valid once valid
  const isContentValid = (suggestedPhrase) => {
    if (!suggestedPhrase) {
      setValidationMessage({
        isValid: false,
        message: 'You must enter a suggestion before sending!'
      });
      return false;
    }

    if (suggestedPhrase.length > 300) {
      setValidationMessage({
        isValid: false,
        message: 'Your suggestion must be less than 300 characters.'
      });
      return false;
    }

    setValidationMessage({
      isValid: true,
      message: 'Your suggestion is valid.'
    });
    return true;
  }

  // ----- COMPONENTS ------

  const header = (
    <h3 className='text-center'>Say Something Random</h3>
  );

  const suggestionForm = !isSuggestionSending && !isSuccessfulSend && (
    <Form>
      <Form.Group controlId="suggestionForm" className='form-group-container'>
        <Form.Control
          className='textarea-styles'
          as="textarea"
          rows="5"
          placeholder="Enter your suggestion"
          ref={suggestionRef}
          aria-describedby="suggestionFormHelpBlock"
          maxLength='300'
          required
          isInvalid={!validationMessage.isValid}
          onChange={() => onChangeForm()}
          disabled={isTransactionPending}
        />
        <Form.Control.Feedback type={validationMessage.isValid ? 'valid' : 'invalid'}>{validationMessage.message}</Form.Control.Feedback>
        <Form.Text id="suggestionFormHelpBlock" muted>
          Your suggestion must be less than 300 characters and follow Twitch TOS. All transactions are final.
        </Form.Text>
      </Form.Group>
    </Form>
  );

  const successMessage = isSuccessfulSend && (
    <div className='text-center success-message'>
      <CheckCircleFill color={'#43A047'} size={'90px'}></CheckCircleFill>
      <p className='message-padding'> Suggestion successfully sent!</p>
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
