import React from 'react'
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';

import { CheckSquareFill, XSquareFill, CheckCircleFill, XCircleFill } from 'react-bootstrap-icons';

import { markPhraseCompleted } from '../../dataclient/dataclient';


 // TODO:
  // - set a max height on listgroup.item w/ overflow ellipsis if really long
  // TODO: if no suggestions - render a placeholder
  // TODO: put custom styles in file for just this component

// suggestions: phrase []
// phrase: {
//   completed: boolean
//   phrase: string,
//   uuid: string,
//   channelId: string,
//   userId: string,
//   displayName: string
// }
export const SuggestionsList = ({suggestions, isLightTheme, authToken, isMod}) => {
  const markCompleted = async (phrase) => {
    const messageId = phrase.uuid;
    // TODO: show isDeletingSpinner? Or just remove it right away as a client lie?
    const { data, error } = await markPhraseCompleted(messageId, authToken);
    console.log('data result:', data);
    if (!!data) {
      // TODO: call to update list and remove this item
    }
  }

  const acceptButton = (phrase) => isMod && (
    // TODO: modify some padding and styles
    <Button variant='link' onClick={() => markCompleted(phrase)} style={{padding: 0}}>
      <CheckSquareFill color={'#00bcd4'} size={20} />
    </Button>
  );
  
  const rejectButton = isMod && (
    <Button variant='link' onClick={() => {console.log('accept clicked')}} style={{padding: 0}}>
      <XSquareFill color={'#00bcd4'} size={20} />
    </Button>
  );


  return (
    <ListGroup>
      {!!suggestions.length ? suggestions.map(item =>
        <ListGroup.Item className={!isLightTheme ? 'makeMeDark' : ''} key={item.uuid}>
          <div>{item.phrase} {acceptButton(item)} {rejectButton} </div>
          {suggestedByUser(item)}
        </ListGroup.Item>)
        : <span>PLACEHOLDER</span>  
      }
    </ListGroup>
  );
}

const suggestedByUser = (item) => (
  <div className='user-displayName'>
    Suggested by: {item.displayName}
  </div>
);
