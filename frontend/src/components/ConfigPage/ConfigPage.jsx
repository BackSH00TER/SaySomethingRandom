import React, {useRef, useState} from 'react'
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Button from 'react-bootstrap/Button';

import { InfoCircle, Check2 } from 'react-bootstrap-icons';

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
      theme:'light',
      configSettings: {},
      products: []
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
      });

      this.twitch.onContext((context,delta) => {
        this.contextUpdate(context,delta);
      });

      // This is only called once during component did mount
      this.twitch.configuration.onChanged(() => {
        let config = this.twitch.configuration?.broadcaster?.content || {};

        console.log('config from config.onchanged', config);
        try {
          config = JSON.parse(config);
          console.log('config parsed', config);
        } catch (error) {
          console.log('error parsing config');
          config = {}
        }

        // Update settings w/ current configuration settings
        this.setState({configSettings: config});
      });

      // Get the bits transaction "products"
      // These are just the different price options the broadcaster can set 100-500 bits
      // NOTE: if the bits in extensions is not supported this will reject with an error
      this.twitch.bits.getProducts().then((products) => {
        this.setState({products});
      }).catch(err => {
        // TODO: err handling
        console.log("Error getting products:", err);
      })
    }
  }

  render() {
    if (this.state.finishedLoading && this.Authentication.isModerator()) {
      return (
        <div className="Config">
          <div className={this.state.theme === 'light' ? 'Config-light' : 'Config-dark'}>
            <h3>BIG LOGO GOES HERE BLUE BANNER TYPE THING</h3>
            <ConfigSettingsComponent
              twitch={this.twitch}
              configSettings={this.state.configSettings}
              products={this.state.products}
            />
          </div>
        </div>
      )
    }
    else {
      return (
        <div className="Config">
          <div className={this.state.theme === 'light' ? 'Config-light' : 'Config-dark'}>
            Loading...
          </div>
        </div>
      )
    }
  }
}

const ConfigSettingsComponent = ({twitch, configSettings, products}) => {
  const [isSaved, setSavedState] = useState(false);
  const bitsPriceRef = useRef(null);
  const allowModControlRef = useRef(null);
  const {bitsPriceSku, allowModControl} = configSettings;

  const saveConfig = () => {
    const bitsPriceSetting = bitsPriceRef.current?.value;
    const allowModControlSetting = allowModControlRef.current?.value;

    const config = {
      bitsPriceSku: bitsPriceSetting,
      allowModControl: allowModControlSetting
    };
    console.log('saveConfig called, config is: ', config);

    // NOTE: This isn't working locally for some reason, might be limitations of developer rig
    // NOTE: Can still test receiving of config settings through Configuration Service tab in the rig
    // TODO: Test this out in live
    console.log('Calling twitch.configuration.set...');
    twitch.configuration.set("broadcaster", "1", JSON.stringify(config));
    console.log('After configuration set, checking if updated:', twitch.configuration.broadcaster?.content);

    setSavedState(true);
  }

  const saveButton = (
    <Button
      className={'save-button'}
      variant={isSaved ? 'success' : 'primary'}
      onClick={() => saveConfig()}
    >
      {!isSaved ?
        'Save' :
        (
          <React.Fragment>
            Saved <Check2 />
          </React.Fragment>
        )
      }
    </Button>
  );

  const bitsPriceTooltip = (props) => (
    <Tooltip id="bits-price-tooltip" {...props}>
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
    <Tooltip id="allow-mods-tooltip" {...props}>
      Allow your mods to help with marking suggestions as completed/rejected.
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

  const getProductsListFormOptions = !!products.length ? (
    <Form.Control
      as="select"
      size="md"
      ref={bitsPriceRef}
      defaultValue={bitsPriceSku || 'submit_suggestion_100'}
      onChange={() => setSavedState(false)}
    >
      {products.map(product => 
        <option value={product.sku} key={product.sku}>{product.cost.amount}</option>
      )};
    </Form.Control>
  ) : (<span>Bits not enabled</span>)

  const configOptions = (
    <Form>
      <Form.Group as={Row} controlId="bitsPriceSetting">
        <Form.Label column sm={4}>
          Bits price
          {bitsInfoIcon}
        </Form.Label>
        <Col sm={7}>
          {getProductsListFormOptions}
        </Col>
      </Form.Group>

      <Form.Group as={Row} controlId="allowModControlRadios">
        <Form.Label column sm={4}>
          Allow mods to accept/reject
          {allowModsInfoIcon}
        </Form.Label>
        <Col sm={7}>
          <Form.Control
            as="select"
            size="md"
            ref={allowModControlRef}
            defaultValue={allowModControl || 'true'}
            onChange={() => setSavedState(false)}
          >
            <option value={'true'}>Yes</option>
            <option value={'false'}>No</option>
          </Form.Control>
        </Col>
      </Form.Group>
    </Form>
  );

  return (
    <div>
      {configOptions}
      {saveButton}
    </div>
  )
}
