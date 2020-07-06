import React from 'react'
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';

import Authentication from '../../util/Authentication/Authentication'

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.Authentication = new Authentication()
    this.fetchPhrases = this.fetchPhrases.bind(this);

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
    this.twitch = window.Twitch ? window.Twitch.ext : null
    this.state = {
      finishedLoading: false,
      isLoadingPhrases: false,
      theme: 'light',
      isVisible: true,
      phrases: []
    }
  }

  contextUpdate(context, delta) {
    if (delta.includes('theme')) {
      this.setState(() => {
        return { theme: context.theme }
      })
    }
  }

  visibilityChanged(isVisible) {
    this.setState(() => {
      return {
        isVisible
      }
    })
  }

  componentDidMount() {
    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        this.Authentication.setToken(auth.token, auth.userId)
        if (!this.state.finishedLoading) { // TODO: Figure out if I need to use finishedLoading??
          // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

          // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
          this.setState(() => {
            return { finishedLoading: true }
          })
        }
      })

      this.twitch.listen('broadcast', (target, contentType, body) => {
        this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)
        // now that you've got a listener, do something with the result... 

        // do something...

      })

      this.twitch.onVisibilityChanged((isVisible, _c) => {
        this.visibilityChanged(isVisible)
      })

      this.twitch.onContext((context, delta) => {
        this.contextUpdate(context, delta)
      })

      // TODO: Something aint right. Spinner needs to go off here toooo pal
      this.fetchPhrases();
    }
  }

  componentWillUnmount() {
    if (this.twitch) {
      this.twitch.unlisten('broadcast', () => console.log('successfully unlistened'))
    }
  }

  // TODO: Move to a different file
  fetchPhrases() {
    const ROOTAPIURL = "http://127.0.0.1:3000/"; //"https://rplbgv9ts3.execute-api.us-east-1.amazonaws.com/prod/";
    const channelId = "123455";
    const url = `${ROOTAPIURL}phrases?channelId=${channelId}`;

    this.setState({ isLoadingPhrases: true }); 

    fetch(url)
      .then(response => response.json())
      .then(responseJson => {
        console.log('resposnjson', responseJson);
        this.setState({ phrases: responseJson });
        this.setState({ isLoadingPhrases: false });
      })

    // console.log('this.state.phrase', this.state.phrases);
  }

  render() {
    const isLightTheme = this.state.theme === 'light';
    const whichTheme = isLightTheme ? 'App-light' : 'App-dark'; // TODO: rename this variable
    
    const loadingState = this.state.isLoadingPhrases && (
      <React.Fragment>
        <Spinner animation="border">
          <span className='sr-only'>Loading...</span>
        </Spinner>
        <div>Loading...</div>
      </React.Fragment>
    );

    const renderList = (
      <ListGroup>
        {this.state.phrases.map(item =>
          <ListGroup.Item className={!isLightTheme ? 'makeMeDark' : ''} key={item.uuid}>
            <div>{item.phrase}</div>
            <div className='user-displayName'>{item.displayName}</div>
          </ListGroup.Item>)}
      </ListGroup>

      // TODO:
      // - set a max height on listgroup.item w/ overflow ellipsis if really long
    );

    const fetchButton = (
      <button onClick={this.fetchPhrases}>Fetch the results</button>
    )

    const shouldRenderList = this.state.finishedLoading && this.state.isVisible && !this.state.isLoadingPhrases;

    // if (this.state.finishedLoading && this.state.isVisible && !this.state.isLoadingPhrases) {
    //   return (
    //     <div className="App">
    //       {renderList}
    //       {fetchButton}
    //     </div>
    //   )
    // } else {
    //   return (
    //     <div className="App">
    //       {loadingState}
    //     </div>
    //   )
    // }
   

    return (
      <div className={`App ${whichTheme}`}>
        {loadingState}
        {shouldRenderList && renderList}
        {shouldRenderList && fetchButton}
      </div>
    )

  }
}


/* EXAMPLE STUFF
const renderPhraseList = (
    <div>Hi</div>
);
const example = (
    <div className={this.state.theme === 'light' ? 'App-light' : 'App-dark'} >
        <p>Hello world2!</p>
        {renderPhraseList}
        <p>My token is: {this.Authentication.state.token}</p>
        <p>My opaque ID is {this.Authentication.getOpaqueId()}.</p>
        <div>{this.Authentication.isModerator() ? <p>I am currently a mod, and here's a special mod button <input value='mod button' type='button'/></p>  : 'I am currently not a mod.'}</div>
        <p>I have {this.Authentication.hasSharedId() ? `shared my ID, and my user_id is ${this.Authentication.getUserId()}` : 'not shared my ID'}.</p>
    </div>
);
*/