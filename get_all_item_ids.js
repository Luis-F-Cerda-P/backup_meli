const fs = require('fs')
const { token, user } = require('./auth_token')
// TODO: Make this program get the most recently created items first, and make it compare the total of items, and the item "CHECK IF UPDATE IS NECESSARY" that
const latestItems = JSON.parse(fs.readFileSync('./item_ids.json'))
const mostRecentItem = latestItems[0]
const latestCountOfItems = latestItems.length

async function fetchIds() {
  const itemIds = []
  const limit = 100
  let offset = 0
  let updateNeeded = true
  let totalItems


  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer " + token);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  do {
    const response = await fetch(`https://api.mercadolibre.com/users/${user}/items/search?limit=${limit}&offset=${offset}&order=start_time_asc`, requestOptions)
    const result = await response.json();
    const results = result.results;

    if (totalItems === undefined) {
      totalItems = result.paging.total
      updateNeeded = !(results[0] === mostRecentItem && totalItems === latestCountOfItems)
      console.log("Update need check result: " + updateNeeded);
      if (!updateNeeded) {
        console.log("Returning ids from 'item_ids' file since update is not needed...")
        return updateNeeded
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    results.forEach(item => itemIds.push(item));
    offset += results.length;

    console.log(`Fetched ${offset} of ${totalItems || '?'}`)
  } while (offset < totalItems && updateNeeded)

  return itemIds
}

async function generateOrReadJsonFileWithAllIds() {
  try {
    const itemIds = await fetchIds();
    if (itemIds) {
      fs.writeFileSync('./item_ids.json', JSON.stringify(itemIds));
      console.log("JSON file generated successfully.");
      return itemIds
    }
    return latestItems
  } catch (error) {
    console.error("Error generating JSON file:", error);
  }
}

const updatedItemIds = generateOrReadJsonFileWithAllIds()


module.exports = updatedItemIds