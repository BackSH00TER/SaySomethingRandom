import React from 'react'
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import { InfoCircle } from 'react-bootstrap-icons';

import Authentication from '../../util/Authentication/Authentication'

import 'bootstrap/dist/css/bootstrap.min.css';
import './Config.css'

export default class ConfigPage extends React.Component {
  constructor(props) {
    super(props)
    this.Authentication = new Authentication()

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
    this.twitch = window.Twitch ? window.Twitch.ext : null
    this.state = {
      finishedLoading:false,
      theme:'light'
    }
  }

  contextUpdate(context, delta) {
    if (delta.includes('theme')) {
      this.setState(()=> {
        return {theme:context.theme}
      })
    }
  }

  componentDidMount() {
    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        this.Authentication.setToken(auth.token, auth.userId)
        if (!this.state.finishedLoading) {
          // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

          // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
          this.setState(() => {
              return {finishedLoading:true}
          })
        }
      })

      this.twitch.onContext((context,delta) => {
        this.contextUpdate(context,delta)
      })
    }
  }


  

  render() {
    const bitsPriceTooltip = (props) => (
      <Tooltip id="bits-price-tooltip" {...props} >
        The price to submit a suggestion.
      </Tooltip>
    );

    const bitsInfoIcon = (
      <OverlayTrigger
        placement="bottom"
        delay={{ show: 100, hide: 200 }}
        overlay={bitsPriceTooltip}
      >
        <InfoCircle className="info-circle" color={'#03a9f4'} size={15} />
      </OverlayTrigger>
    );

    const allowModsTooltip = (props) => (
      <Tooltip id="allow-mods-tooltip" {...props} >
        Allow your mods to help you with marking suggestions as completed/rejected.
      </Tooltip>
    );

    const allowModsInfoIcon = (
      <OverlayTrigger
        placement="bottom"
        delay={{ show: 100, hide: 200 }}
        overlay={allowModsTooltip}
      >
        <InfoCircle className="info-circle" color={'#03a9f4'} size={15} />
      </OverlayTrigger>
    );

    const configOptions = (
      <Form>
        <Form.Group as={Row} controlId="setting1">
          <Form.Label column sm={3}>
            Bits price
            {bitsInfoIcon}
          </Form.Label>
          <Col sm={8}>
            <Form.Control as="select" size="md">
              <option>Option1</option>
              <option>Option2</option>
              <option>Option3</option>
            </Form.Control>
          </Col>
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Label column sm={3}>
            Allow mods to accept/reject
            {allowModsInfoIcon}
          </Form.Label>
          <Col sm={8}>
            <Form.Check
              type="radio"
              inline
              label="Yes" 
              name="allowModControlRadios"
              id="inline-radio-yes"
            />
            <Form.Check
              type="radio"
              inline
              label="No" 
              name="allowModControlRadios"
              id="inline-radio-no"
            />
          </Col>
        </Form.Group>
      </Form>
    )


    if (this.state.finishedLoading && this.Authentication.isModerator()) {
      return (
        <div className="Config">
          <div className={this.state.theme==='light' ? 'Config-light' : 'Config-dark'}>
            <h3>BIG LOGO GOES HERE BLUE BANNER TYPE THING</h3>
            There is no configuration needed for this extension!
            {configOptions}
          </div>
        </div>
      )
    }
    else {
      return (
        <div className="Config">
          <div className={this.state.theme==='light' ? 'Config-light' : 'Config-dark'}>
            Loading...
          </div>
        </div>
      )
    }
  }
}