const fs = require('fs')
const mostRecentBackupPath = findNewestFile('./BACKUP/')
const itemsData = JSON.parse(fs.readFileSync(mostRecentBackupPath))
const itemsDataValues = Object.values(itemsData)
// let numberOfNonCatalogListings = 0
const setOfUniqueSkus = itemsDataValues.reduce((uniqueSkus, currentItem) => {
  if (!currentItem.catalog_listing) {
    // numberOfNonCatalogListings++
    if (currentItem.variations) {
      for (const variation of currentItem.variations) {    
        const sku = variation?.attributes?.find(attribute => attribute.id === "SELLER_SKU")?.value_name
        if (sku) uniqueSkus.add(sku)
      }

    } else {
      const sku = currentItem?.attributes?.find(attribute => attribute.id === "SELLER_SKU")?.value_name
      if (sku) uniqueSkus.add(sku)
    }
    
  }

  return uniqueSkus
}, new Set())


const output = [...setOfUniqueSkus].sort().join("\n")
const scriptName = __filename.split("\\").reverse()[0].slice(0, -3)

fs.writeFileSync('./FEATURES_OUTPUT/' + scriptName + ".txt", output)
// console.log(numberOfNonCatalogListings)
// console.table(output)

/* 
Itero a través de las publicaciones

!!!!
Sigo de largo en el loop si la publicación es de catálogo. <- O quizá es mejor simplemente filtrar antes. <- No porque en el filtro hay un iteración pero luego habría otra... o el mismo filtro puede tener todo, ya que eso es lo que estoy haciendo 
!!!!
Filter no sirve porque filter me regresa los elementos tal cual como vienen. Creo que la respuesta es reduce() => Chequeo todo lo que tengo que chequear y pusheo a un Set() <- Veamos si se puede.
!!!!

Leo en cada una los sku que hay 
  Los Sku pueden estar en:
    Los atributos de cada variación (cuando hay)
    Los atributos normales (cuando no hay) <- Aunque esto lo están deprecando. Ahora los productos "sin variación" los están modelando para tener una variación única 
  Así que la lógica puede ser: 
    Si hay 0 variaciones, sácalo de attributes
    Caso contrario, itera por las variaciones y mete todos los SKU al set. 
Debo implementar el mismo proceso para los GTIN únicos ? <- El problema es que al parecer algunas publicaciones no tienen GTIN. 
*/


function findNewestFile(directoryPath) {
  let newestFile = null;
  let newestTime = 0;

  const files = fs.readdirSync(directoryPath);

  files.forEach(file => {
    const filePath = `${directoryPath}/${file}`;
    const stats = fs.statSync(filePath);

    if (stats.isFile() && stats.ctimeMs > newestTime) {
      newestFile = filePath;
      newestTime = stats.ctimeMs;
    }
  });

  return newestFile;
}