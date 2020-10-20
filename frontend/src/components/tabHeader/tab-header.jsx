import React, {useState} from 'react';
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';

import { SuggestionForm } from '../suggestionForm/suggestion-form';
import { SuggestionsList } from '../suggestionsList/suggestions-list';

import './tab-header.css';

export const TabHeader = ({phrases, isLightTheme, shouldRenderList, authToken, isMod, productSku, allowModControl, isBroadcaster}) => {
  return (
    <Tab.Container id="main-tabs" defaultActiveKey="first">
      <TopNav />
      <TabContent
        phrases={phrases}
        isLightTheme={isLightTheme}
        shouldRenderList={shouldRenderList}
        authToken={authToken}
        isMod={isMod}
        isBroadcaster={isBroadcaster}
        allowModControl={allowModControl}
        productSku={productSku}
      />
    </Tab.Container>
  );
};

const TopNav = () => {
  const [selected, setSelected] = useState("first");

  const onSelectItem = (item) => {
    setSelected(item);
  }

  return (
    <Nav justify variant="pills" onSelect={(item) => onSelectItem(item)} className="tab-header">
      <Nav.Item>
        <Nav.Link
          className={selected === "first" ? "selected-nav-item" : "nav-item-plain"}
          eventKey="first"
          onClick={() => setSelected("first")}
        >
          Suggestions
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          className={selected === "second" ? "selected-nav-item" : "nav-item-plain"}
          eventKey="second"
          onClick={() => setSelected("second")}
        >
          Add Suggestion
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

const TabContent = ({phrases, isLightTheme, shouldRenderList, authToken, isMod, productSku, allowModControl, isBroadcaster}) => {
  return (
    <Tab.Content>
      <Tab.Pane eventKey="first">
        {shouldRenderList && (
          <SuggestionsList
            suggestions={phrases}
            isLightTheme={isLightTheme}
            authToken={authToken}
            isMod={isMod}
            isBroadcaster={isBroadcaster}
            allowModControl={allowModControl}
          />
        )}
      </Tab.Pane>
      <Tab.Pane eventKey="second">
        <SuggestionForm authToken={authToken} productSku={productSku} />
      </Tab.Pane>
    </Tab.Content>
  );
};
