
const ROOT_API_URL = "http://127.0.0.1:3000/"; //"https://rplbgv9ts3.execute-api.us-east-1.amazonaws.com/prod/";
export const FAILED_TO_FETCH = "FAILED_TO_FETCH";

export const fetchPhrases = async (channelId, authToken) => {
  const url = `${ROOT_API_URL}phrases?channelId=${channelId}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer  ${authToken}`
      }
    });

    if (response.status === 200) {
      return {
        data: await response.json(),
        error: null
      };
    } else {
      throw new Error(response);
    }
  } catch (error) {
    console.log(`Failed to fetch phrases : ${error}`);
    return {
      data: null,
      error: FAILED_TO_FETCH
    }
  }
}

// fetchPhrases() {
//   const ROOTAPIURL = "http://127.0.0.1:3000/"; //"https://rplbgv9ts3.execute-api.us-east-1.amazonaws.com/prod/";
//   const channelId = "123455"; // TODO: Use real channelID
//   const url = `${ROOTAPIURL}phrases?channelId=${channelId}`;

//   this.setState({ isLoadingPhrases: true }); 

//   fetch(url, { 
//     headers: {
//       "Authorization": 'Bearer ' + this.Authentication.getToken()
//   }})
//     .then(response => response.json())
//     .then(responseJson => {
//       console.log('resposnjson', responseJson);
//       this.setState({ phrases: responseJson });
//       this.setState({ isLoadingPhrases: false });
//     })
// }

// const submitPhrase = () => {
//   console.log('submitPhrase called');
//   const ROOTAPIURL = "http://127.0.0.1:3000"; //"https://rplbgv9ts3.execute-api.us-east-1.amazonaws.com/prod/";
//   const url = `${ROOTAPIURL}/phrase`;

//   const suggestedPhrase = suggestionRef && suggestionRef.current && suggestionRef.current.value;
//   if (!suggestedPhrase) {
//     console.log(' no phrase suggested');
//     // TODO: validation handling here, spit back error to type something before submitting
//   }

//   const body = {
//     phrase: suggestedPhrase
//   };

//   const options = {
//     method: 'POST',
//     body: JSON.stringify(body),
//     headers: {
//       'Content-Type': 'application/json',
//       "Authorization": 'Bearer ' + authToken // TODO: this might be undefined, should try to make suggestionform not render unless authenticated
//     }
//   }

//   setSuggestionSending(true);

//   fetch(url, options)
//     .then(res => res.json())
//     .then(resJ => {
//       console.log('submitPhrase response', resJ);
//       setModalShow(false);
//       setSuggestionSending(false);
//       setShowToast(true);
//       suggestionRef.current.value = null; // resets text
//       // TODO: Trigger some sort of success modal
//     });
// }