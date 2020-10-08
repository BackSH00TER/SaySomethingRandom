import React, {useState} from 'react';
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';

import { SuggestionForm } from '../suggestionForm/suggestion-form';
import { SuggestionsList } from '../suggestionsList/suggestions-list';

import './tab-header.css';

export const TabHeader = ({phrases, isLightTheme, shouldRenderList, authToken, isMod}) => {
  return (
    <Tab.Container id="main-tabs" defaultActiveKey="first">
      <TopNav />
      <TabContent phrases={phrases} isLightTheme={isLightTheme} shouldRenderList={shouldRenderList} authToken={authToken} isMod={isMod} />
    </Tab.Container>
  );
};

const TopNav = () => {
  const [selected, setSelected] = useState("first");

  return (
    <Nav justify variant="pills" className="tab-header">
      <Nav.Item>
        <Nav.Link
          className={selected === "first" ? "selected-nav-item selected-left" : "nav-item-plain"}
          eventKey="first"
          onClick={() => setSelected("first")}
        >
          Suggestions
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          className={selected === "second" ? "selected-nav-item selected-right" : "nav-item-plain"}
          eventKey="second"
          onClick={() => setSelected("second")}
        >
          Add Suggestion
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

const TabContent = ({phrases, isLightTheme, shouldRenderList, authToken, isMod}) => {
  return (
    <Tab.Content>
      <Tab.Pane eventKey="first">
        {shouldRenderList && (
          <SuggestionsList
            suggestions={phrases}
            isLightTheme={isLightTheme}
            authToken={authToken}
            isMod={isMod}
          />
        )}
      </Tab.Pane>
      <Tab.Pane eventKey="second">
        <SuggestionForm authToken={authToken} />
      </Tab.Pane>
    </Tab.Content>
  );
};