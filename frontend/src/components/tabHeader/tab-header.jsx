import React, {useState} from 'react';
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';

import { SuggestionForm } from '../suggestionForm/suggestion-form';
import { SuggestionsList } from '../suggestionsList/suggestions-list';

import './tab-header.css';

export const TabHeader = ({phrases, isLightTheme, shouldRenderList, authToken}) => {
  return (
    <Tab.Container id="main-tabs" defaultActiveKey="first">
      <TopNav />
      <TabContent phrases={phrases} isLightTheme={isLightTheme} shouldRenderList={shouldRenderList} authToken={authToken} />
    </Tab.Container>
  );
}

const TopNav = () => {
  const [selected, setSelected] = useState("first");

  return (
    <Nav justify>
      <Nav.Item>
        <ConditionalBoldWrapper condition={selected === "first"} >
          <Nav.Link className={selected === "first" ? "selected-nav-item" : ""} eventKey="first" onClick={() => setSelected("first")}>Suggestions</Nav.Link>
        </ConditionalBoldWrapper>
      </Nav.Item>
      <Nav.Item>
        <ConditionalBoldWrapper condition={selected === "second"}>
          <Nav.Link className={selected === "second" ? "selected-nav-item" : ""} eventKey="second" onClick={() => setSelected("second")}>Add Suggestion</Nav.Link>
        </ConditionalBoldWrapper>
      </Nav.Item>
    </Nav>
  );
};

// Conditionally wraps given children in a bold tag
const ConditionalBoldWrapper = ({ condition, children }) =>
  condition ? <strong>{children}</strong> : children;

const TabContent = ({phrases, isLightTheme, shouldRenderList, authToken}) => {
  return (
    <Tab.Content>
      <Tab.Pane eventKey="first">
        {shouldRenderList && (<SuggestionsList
          suggestions={phrases}
          isLightTheme={isLightTheme}
        />)}
        {/* {shouldRenderList && fetchButton} */}
      </Tab.Pane>
      <Tab.Pane eventKey="second">
        <SuggestionForm authToken={authToken} />
      </Tab.Pane>
    </Tab.Content>
  );
}
