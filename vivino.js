const puppeteer = require('puppeteer');
const fetch = require('node-fetch')

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

(async () => {
    const URL = 'https://www.vivino.com/'
    const browser = await puppeteer.launch({
      args: ["--window-size=1920,1080"],
      headless: false,
      defaultViewport: null,
      ignoreHTTPSErrors: true,
    });
  const page = await browser.newPage();
  await page.goto(URL);
  await page.screenshot({path: 'example.png'});

  const [selector] = await page.$x('/html/body/div[2]/div[1]/div/div[2]/div/div[1]/div/a');
  
  await selector.click();

  await page.waitFor(getRndInteger(4000,6000));

  //MOVE SLIDER
  const example = await page.$$('div[role="slider"]');
  let bounding_box = await example[0].boundingBox();

  await page.mouse.move(bounding_box.x + bounding_box.width / 2, bounding_box.y + bounding_box.height / 2);
  await page.mouse.down();
  await page.mouse.move(2, bounding_box.y);
  await page.mouse.up();

  bounding_box = await example[1].boundingBox();
  await page.waitFor(getRndInteger(1000,3000));

  await page.mouse.move(bounding_box.x + bounding_box.width / 2, bounding_box.y + bounding_box.height / 2);
  await page.mouse.down();
  await page.mouse.move(1200, bounding_box.y);
  await page.mouse.up();

  await page.waitFor(getRndInteger(1000,3000));

  //Remove red and white wine selections
  
  let buttons = await page.$$('label[class="pill__pill--2AMAs pill__selected--3KX2r filterByWineType__pill--DDMJ3"]');
  await buttons[0].click();
  await page.waitFor(getRndInteger(1000,2000));
  await buttons[1].click();

  await page.waitFor(getRndInteger(1000,3000));
  let ratings = await page.$$('input[name="rating"]')
  await ratings[4].click();
  await page.waitFor(getRndInteger(1000,3000));
  await page.evaluate(`window.scrollTo(0, (document.body.scrollHeight - (document.body.scrollHeight - 800) ) )`);
  await page.waitFor(getRndInteger(1000,3000));
  
  // Select Country
  await page.type('input[placeholder="Search countries"]' , 'Croatia', {delay:100})
  await page.waitFor(getRndInteger(3000,5000));
  let country = await page.$$('div[class="pill__inner--2uty5"]');
  await country[22].click()

  await page.waitFor(getRndInteger(1000,3000));

  await page.evaluate(`window.scrollTo(0, 0)`);

  await page.waitFor(getRndInteger(1000,3000));


  //scroll to bottom
  await autoScroll(page);

  let items = [];
  let productssElement = await page.$$('div[class="explorerCard__titleColumn--28kWX"]');

  for (let product of productssElement) {
    let name = await product.$eval(
      'div.vintageTitle__vintageTitle--2iCdc a span.vintageTitle__wine--U7t9G',
      (element) => element.innerText.replace('"','').replace('"','')
    );
    let manufacturer = await product.$eval(
      "div.vintageTitle__vintageTitle--2iCdc a span.vintageTitle__winery--2YoIr",
      (element) => element.innerText
    );
    let locations = await product.$$eval('div.vintageTitle__vintageTitle--2iCdc div.vintageLocation__vintageLocation--1DF0p a[class="anchor__anchor--2QZvA vintageLocation__anchor--T7J3k"]',
    anchors => { return anchors.map(anchor => anchor.textContent) })

    let country = locations[1];
    let region = locations[2];

    let rating = await product.$eval( 
      'div.explorerCard__ratingAndPrice--2dw-T div[class="vivinoRatingWide__vivinoRatingWide--1anqU vivinoRatingWide__sizeMedium--2RWrK"] div.vivinoRatingWide__averageValue--1zL_5',
      (element) =>  parseFloat(element.innerText)
    );
    let votes = await product.$eval(
      'div.explorerCard__ratingAndPrice--2dw-T  div[class="vivinoRatingWide__vivinoRatingWide--1anqU vivinoRatingWide__sizeMedium--2RWrK"] div.vivinoRatingWide__starsAndReviews--rllAo div.vivinoRatingWide__basedOn--s6y0t',
      (element) => parseFloat(element.innerText)
    );
    items.push({ name, manufacturer, country, region, rating, votes });
  }

  //console.log(items)

  let kveri = '';
  items.forEach(element => {
  kveri = kveri + '{name: "' + element.name +'", country: "' + element.country +'", region: "' + element.region +'", manufacturer: "'+ element.manufacturer + '", rating: '+ element.rating +', votes: ' + element.votes + '}'
  
  })

  const data = {
    query : `
    mutation MyQuery {
      insert_vivino(objects: [ ${kveri} ]) { 
        affected_rows
      }
    }
    `
  }
  // console.log(data);

  // debugger
 
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


  //debugger
  await browser.close();
})();


async function autoScroll(page){
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 100;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                  clearInterval(timer);
                  resolve();
              }
          }, 500);
      });
  });
}
