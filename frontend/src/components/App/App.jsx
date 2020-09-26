import React from 'react'
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';

import Authentication from '../../util/Authentication/Authentication';
import { fetchPhrases, FAILED_TO_FETCH } from '../../dataclient/dataclient';

import { TabHeader } from '../tab-header';


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
      phrases: [],
      currentChannelId: ''
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
            return { finishedLoading: true, currentChannelId: auth.channelId }
          })
        }

        // I think this needs to go here
        // THis needs to be called after we are authorized so we can pass the auth token,
        // actually we want to renderer phrases even if they aren't authorized..
        this.fetchPhrases()
      })

      // TODO: This might help a bit https://dev.twitch.tv/docs/tutorials/extension-101-tutorial-series/file-structure
      this.twitch.listen('broadcast', (target, contentType, body) => {
        console.log('PUBSUB LISTEN event fired');
        this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)

        // TODO: Consider just using the response that is returned from the endpoint.
        //    Might not be necessary to have response go through PubSub response as well
        const postedPhrase = JSON.parse(body);

        this.updatePhrases(postedPhrase);
      })

      this.twitch.onVisibilityChanged((isVisible, _c) => {
        this.visibilityChanged(isVisible)
      })

      this.twitch.onContext((context, delta) => {
        console.log('onContext called', context);
        this.contextUpdate(context, delta)
      })
    }
  }

  componentWillUnmount() {
    if (this.twitch) {
      this.twitch.unlisten('broadcast', () => console.log('successfully unlistened'))
    }
  }

  // TODO: Move API calls to a different file
  async fetchPhrases() {
    const channelId = "123455"; // TODO: Use real channelID
    this.setState({ isLoadingPhrases: true }); 
    // TODO: Note this way doesnt work yet, need to get support for babel regeneratorRuntime, etc
    const {data, error} = await fetchPhrases(channelId, this.Authentication.getToken());
    
    if (!!data) {
      this.setState({ phrases: data});
      this.setState({ isLoadingPhrases: false})
    } else {
      this.setState({ isLoadingPhrases: false})
      // TODO: setState is error true, render error fetching msg
    }
    // const ROOTAPIURL = "http://127.0.0.1:3000/"; //"https://rplbgv9ts3.execute-api.us-east-1.amazonaws.com/prod/";
    // const channelId = "123455"; // TODO: Use real channelID
    // const url = `${ROOTAPIURL}phrases?channelId=${channelId}`;

    // this.setState({ isLoadingPhrases: true }); 

    // fetch(url, { 
    //   headers: {
    //     "Authorization": 'Bearer ' + this.Authentication.getToken()
    // }})
    //   .then(response => {
    //     console.log('raw response', response);
    //     return response.json()
    //   })
    //   .then(responseJson => {
    //     console.log('resposnjson', responseJson);
    //     this.setState({ phrases: responseJson });
    //     this.setState({ isLoadingPhrases: false });
    //   })
    //   .catch(err => {
    //     console.log('err is', err);
    //   })
  }

  updatePhrases(phraseToAdd) {
    const currentPhrases = this.state.phrases;
    const updatedPhrases = [...currentPhrases, phraseToAdd];

    this.setState({ phrases: updatedPhrases });
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

    // TODO: Move to own file
    const fetchButton = (
      <Button onClick={this.fetchPhrases}>Refresh results</Button>
    )

    const shouldRenderList = this.state.finishedLoading && this.state.isVisible && !this.state.isLoadingPhrases;

    const tabs = !this.state.isLoadingPhrases && (
      <TabHeader phrases={this.state.phrases} isLightTheme={isLightTheme} shouldRenderList={shouldRenderList} authToken={this.Authentication.getToken()} />
    );
   
    // const example = (
    //   <div className={this.state.theme === 'light' ? 'App-light' : 'App-dark'} >
    //       <p>This is the auth example</p>
    //       <p>My token is: {this.Authentication.state.token}</p>
    //       <p>My opaque ID is {this.Authentication.getOpaqueId()}.</p>
    //       <div>{this.Authentication.isModerator() ? <p>I am currently a mod, and here's a special mod button <input value='mod button' type='button'/></p>  : 'I am currently not a mod.'}</div>
    //       <p>I have {this.Authentication.hasSharedId() ? `shared my ID, and my user_id is ${this.Authentication.getUserId()}` : 'not shared my ID'}.</p>
    //       <p>ChannelId is: {this.state.currentChannelId}</p>
    //       <p>Is broadcaster? {this.twitch.configuration.broadcaster} </p>
    //       <p>Are bits enabled {this.twitch.bits.showBitsBalance()}</p>
    //   </div>
    // );
    

    return (
      <div className={`App ${whichTheme}`}>
        {loadingState}
        {tabs}
        {/* {example} */}
      </div>
    )

  }
}


/* EXAMPLE STUFF
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