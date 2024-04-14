// TODO: Dont fetch descriptions for catalog listings! They will be empty. That's half a second wasted per catalog listing... 
// TODO: make sure you're getting the information in the correct order 
// TODO: Check against previous version of the backup what information has changed ? using the last_updated property
const fs = require('fs')
const { token } = require('./auth_token')
const updatedItemList = require('./get_all_item_ids')
const itemsWithInfo = {}

function chunkIdsIntoStringsForMultiget(array, chunkSize = 20) {
  const chunked = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunked.push(array.slice(i, i + chunkSize).join(","))
  }

  return chunked
}

async function fetchItemsWithInfo() {
  const ids = await updatedItemList;
  const multigetStrings = chunkIdsIntoStringsForMultiget(ids);
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer " + token);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  console.log("STARTED FETCH OF ITEM'S INFO:")

  const fetchPromises = multigetStrings.map(async (stringOf20Ids, index) => {
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Call ${index + 1} of ${multigetStrings.length}`);
        resolve()
      }, index * 500); // Adjust the delay based on the index
    });

    try {
      const response = await fetch("https://api.mercadolibre.com/items?include_attributes=all&order=start_date_asc&ids=" + stringOf20Ids, requestOptions);
      if (!response.ok) {
        throw new Error(`A problem occurred fetching items! Chunk: ${index}. Status: ${response.status}.`);
      }
      const chunkOfResponses = await response.json();
      chunkOfResponses.forEach(response => itemsWithInfo[response.body.id] = response.body);
      return itemsWithInfo;
    } catch (error) {
      console.error(error);
      throw error; // Re-throw the error to be caught by the caller
    }
  });

  try {
    await Promise.all(fetchPromises);

    return itemsWithInfo;
  } catch (error) {
    console.error(error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

async function fetchItemDescriptions() {
  const ids = await updatedItemList
  const requestOptions = {
    method: "GET",
    redirect: "follow"
  };

  console.log("STARTED FETCH OF ITEM'S DESCRIPTIONS:")
  const descriptionsRequests = ids.map(async (id, index) => {
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Call ${index + 1} of ${ids.length}`)
        resolve()
      }, index * 500);
    })

    try {
      const response = await fetch("https://api.mercadolibre.com/items/" + id + "/description", requestOptions)
      const responseBody = await response.json();
      itemsWithInfo[id].description = responseBody.plain_text
      if (!response.ok) {
        itemsWithInfo[id].description = responseBody.message
        // throw new Error(`A problem occurred fetching items! Item: ${id}. Error: ${responseBody.message}.`);
      }
      return itemsWithInfo;
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  try {
    await Promise.all(descriptionsRequests);

    return itemsWithInfo;
  } catch (error) {
    console.error(error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

// Call the async function and handle the result or error
fetchItemsWithInfo(updatedItemList)
  .then(() => {
    return fetchItemDescriptions()
  })
  .then(() => {
    const dateString = new Date().toISOString().replaceAll(":", "").slice(0, -5)
    const filePath = './BACKUP/' + dateString + '_items_complete_info.json'
    console.log("itemsWithInfo.length: ", Object.keys(itemsWithInfo).length)

    fs.writeFileSync(filePath, JSON.stringify(itemsWithInfo))

    return Promise.resolve();
  })
  .catch((error) => {
    console.error(error);
  });






