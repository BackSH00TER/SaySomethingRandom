import React from 'react'
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';

import { CheckSquareFill, XSquareFill } from 'react-bootstrap-icons';

import { markPhraseCompleted } from '../../dataclient/dataclient';

import './suggestions-list.css';

/**
 * Renders the main list of suggestions
 * Displays the suggestion and the user who posted it
 * Moderators are shown an option to mark an item as completed
 * @param {object} props
 *    props.suggestions - array of suggestions [ { completed: boolean, phrase: string, uuid: string, channelId: string, userId: string, displayName: string}]
 *    props.authToken - (string) - the jwt authToken (backend to verify)
 *    props.isMod - (boolean) - is the user a moderator of the channel 
 */
export const SuggestionsList = ({suggestions, isLightTheme, authToken, isMod}) => {
  const acceptButton = (phrase) => isMod && (
    <Button
      variant='link'
      className='button-action'
      onClick={() => markCompleted(phrase, authToken)}
    >
      <CheckSquareFill className='button-action-accept' color={'#43A047'} size={20} />
    </Button>
  );
  
  const rejectButton = isMod && ( // TODO: wire up - if decide to use this
    <Button
      variant='link'
      className='button-action'
      onClick={() => {console.log('accept clicked')}}
    >
      <XSquareFill className='button-action-reject' color={'#E53935'} size={20} />
    </Button>
  );

  return (
    <ListGroup variant='flush'>
      {!!suggestions.length ? suggestions.map(item =>
        <ListGroup.Item className='dark-list-item' key={item.uuid}>
          <div>{item.phrase}</div>
          <div className='msg-action-buttons'>{acceptButton(item)} {rejectButton}</div>
          {suggestedByUser(item)}
        </ListGroup.Item>)
        : <span>PLACEHOLDER</span>  
      }
    </ListGroup>
  );
}

const suggestedByUser = (item) => (
  <div className='user-displayName' title={`Suggested by: ${item.displayName}`}>
    Suggested by: {item.displayName}
  </div>
);

const markCompleted = async (phrase, authToken) => {
  const messageId = phrase.uuid;
  // TODO: show isDeletingSpinner? Or just remove it right away as a client lie?
  const { data, error } = await markPhraseCompleted(messageId, authToken);
  console.log('data result:', data);
  if (!!data) {
    // TODO: call to update list and remove this item
  }
}
