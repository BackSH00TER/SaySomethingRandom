import React from 'react'
import ListGroup from 'react-bootstrap/ListGroup';

 // TODO:
  // - set a max height on listgroup.item w/ overflow ellipsis if really long
  // TODO: if no suggestions - render a placeholder
  // TODO: put custom styles in file for just this component
export const SuggestionsList = ({suggestions, isLightTheme}) => {
  return (
    <ListGroup>
      {!!suggestions.length ? suggestions.map(item =>
        <ListGroup.Item className={!isLightTheme ? 'makeMeDark' : ''} key={item.uuid}>
          <div>{item.phrase}</div>
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