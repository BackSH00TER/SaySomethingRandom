import React, {useState, useRef} from 'react'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import { CheckCircleFill, ExclamationTriangle, EmojiFrown } from 'react-bootstrap-icons';

import { sendPhrase, FAILED_TO_SEND } from '../../dataclient/dataclient';
import { IS_DEV_MODE } from '../../util/constants';
import OtsIconWhite from "../../assets/ots-icon-white.png";
import OtsWhite from "../../assets/ots-white.png";

import './suggestion-form.css';

export const SuggestionForm = ({authToken, productSku, isViewerLoggedIn}) => {
  const [isSuggestionSending, setSuggestionSending] = useState(false);
  const [isSuccessfulSend, setSuccessfulSend] = useState(false);
  const [isTransactionPending, setTransactionPending] = useState(false);
  const [isErrorSending, setErrorSending] = useState(false);
  const [validationMessage, setValidationMessage] = useState({isValid: true, message: ''});
  const suggestionRef = useRef(null);
  const twitch = window.Twitch ? window.Twitch.ext : null;
  
  const selectedProductSku = productSku || "submit_suggestion_100";
  const isBitsEnabled = !!(twitch?.features.isBitsEnabled);

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
      console.log('Failed to sendPhrase, showing error');
      setSuggestionSending(false)
      setErrorSending(true);
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

  // Client side validation of content meets requirements:
  // - No empty phrase
  // - 300 characters max
  // - no TOS breakage (Future)
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

  const isDisabled = isTransactionPending || !isBitsEnabled || !isViewerLoggedIn;

  const suggestionForm = !isSuggestionSending && !isSuccessfulSend && !isErrorSending && (
    <Form>
      <Form.Group controlId="suggestionForm" className='form-group-container'>
        <Form.Control
          className={isDisabled ? 'textarea-disabled' :'textarea-styles'}
          as="textarea"
          rows="5"
          placeholder="Enter your suggestion"
          ref={suggestionRef}
          aria-describedby="suggestionFormHelpBlock"
          maxLength='300'
          required
          isInvalid={!validationMessage.isValid}
          onChange={() => onChangeForm()}
          disabled={isDisabled}
        />
        <Form.Control.Feedback type={validationMessage.isValid ? 'valid' : 'invalid'}>{validationMessage.message}</Form.Control.Feedback>
        <Form.Text id="suggestionFormHelpBlock" className='form-help-block'>
          Your suggestion must be less than 300 characters and follow Twitch TOS. All transactions are final.
        </Form.Text>
      </Form.Group>
    </Form>
  );

  const successMessage = (
    <div className='text-center info-message'>
      <CheckCircleFill color={'#43A047'} size={'90px'}></CheckCircleFill>
      <p className='message-padding'>Suggestion successfully sent!</p>
    </div>
  );

  const postAnotherButton = (
    <Button
      className='post-another-button'
      variant="primary"
      onClick={() => resetState()}
    >
      Post Another
    </Button>
  );

  const successfulSendScreen = isSuccessfulSend && (
    <div>
      {successMessage}
      {postAnotherButton}
      <div className='text-center success-logo-footer'>
        <img src={OtsWhite} width="58px" height="50px" />
      </div>
    </div>
  );

  const errorMessage = isErrorSending && (
    <div className='text-center info-message'>
      <EmojiFrown color={'#E53935'} size={'90px'}></EmojiFrown>
      <p className='message-padding'>There was an error sending the message. If this error continues please contact the Extension developer.</p>
    </div>
  );

  const sendSuggestionButton = !isSuccessfulSend && !isSuggestionSending && (
    <Button
      className='send-button text-center'
      block
      onClick={() => onClickSend()}
      disabled={isDisabled}
    >
      <img src={OtsIconWhite} width="15px" height="15px" /> Send suggestion
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

  const bitsDisabledMessage = !isBitsEnabled && (
    <div className='bits-disabled-message'>
      <h4 className='text-center'>
        <ExclamationTriangle className='warning-icon-left' color={'#ffcc00'} size={'20'}/>
        Bits disabled
        <ExclamationTriangle className='warning-icon-right' color={'#ffcc00'} size={'20'}/>
      </h4>
      This feature requires bits to be enabled. This broadcaster may not be affiliated / partnered with Twitch, thus bits are disabled. 
      Show them your support so this feature can be enabled.
    </div>
  );

  const mustLoginMessage = !isViewerLoggedIn && (
    <div className='bits-disabled-message'>
      <h4 className='text-center'>
        <ExclamationTriangle className='warning-icon-left' color={'#ffcc00'} size={'20'}/>
        Logged out
        <ExclamationTriangle className='warning-icon-right' color={'#ffcc00'} size={'20'}/>
      </h4>
      You must sign in first before you can submit your own suggestion.
    </div>
  );

  return (
    <React.Fragment>
      <div className='form-region'>
        {suggestionForm}
        {sendingSpinner}
        {successfulSendScreen || errorMessage}
        {bitsDisabledMessage || mustLoginMessage}
      </div>
      <div className='footer-region'>
        {sendSuggestionButton}
      </div>
    </React.Fragment>
  );
};
