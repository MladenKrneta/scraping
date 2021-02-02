const puppeteer = require("puppeteer");
const fetch = require('node-fetch')

const fun = async(url) => {
  try {
    const browser = await puppeteer.launch({
      args: ["--window-size=1920,1080"],
      headless: false,
      defaultViewport: null,
      ignoreHTTPSErrors: true,
    });
    //Wines
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitFor(10000);

    await page.click('a[class="accept"]');
    await page.waitFor(1000);
    category = await page.$eval('ul[class="categories vertical-menu-bg"] li a[class="active"] span', (element) => element.innerText)
    let limit_buttons = await page.$$("div.input-limit button");
    await limit_buttons[4].click();

    await page.waitFor(18000);

    await page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
    await page.waitFor(1000);
    let more = await page.$("button#button-show-more");
    if (more) {
      await more.click();
    }
    await page.waitFor(18000);

    while (more != null) {
      await page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
      await page.waitFor(1000);
      more = await page.$("button#button-show-more");
      if (more) {
        await more.click();
      }
      await page.waitFor(18000);
    }
    let items = [];

    let productssElement = await page.$$("div.single-product");

    for (let product of productssElement) {
      let name = await product.$eval(
        "div.caption a.product-name",
        (element) => element.innerText.replace('"','').replace('"','')
      );
      let sku = await product.$eval(
        "div.caption div.custom-fields-field-1",
        (element) => element.innerText
      );
      let price = await product.$eval(
        "div.caption div.price-wrapper div.price span",
        (element) =>  parseFloat(element.innerText.replace(".", "").replace(",","."))
      );
      items.push({ name, category, sku, price });
    }
    await browser.close();
    return items

  } catch (err) {
    debugger;
  }
}

(async () => {
  //let URL = "https://webshop.rotodinamic.hr/vino";

  let wines = await fun('https://webshop.rotodinamic.hr/vino');
  let beers = await fun('https://webshop.rotodinamic.hr/pivo');
  let sodas = await fun('https://webshop.rotodinamic.hr/sokovi');
  let spirits = await fun('https://webshop.rotodinamic.hr/jaka-alkoholna-pica');
  let spices = await fun('https://webshop.rotodinamic.hr/zacini');
  let waters = await fun('https://webshop.rotodinamic.hr/voda');
  let warm_beverages = await fun('https://webshop.rotodinamic.hr/topli-napitci');
  let snacks = await fun('https://webshop.rotodinamic.hr/grickalice');

  let all = [...wines, ...beers, ...sodas, ...snacks, ...spirits, ...spices, ...waters, ...warm_beverages];
  // console.log(snacks)

let items = '';
all.forEach(element => {
  items = items + `{name: "' + element.name + '", price: '+ element.price +', category: "' + element.category + '", sku : "' +  element.sku + '"}`
  
  })

  const data = {
    query : `
    mutation {
      insert_roto(objects: [ ${items} ]) { 
        affected_rows
      }
    }
    `
  }
 // console.log(data);



  fetch('https://barbara-white-mice.herokuapp.com/v1/graphql', {
    method : 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then( res => {
    if (res.status !== 200 && res.status !== 201){
      throw new Error('Fail')
    }
    return res.json();
  })
  .then(resData =>{
    console.log(resData)
  })
  .catch(err => {
    console.log(err)
  })
 debugger

})();
