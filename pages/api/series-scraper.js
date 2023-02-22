const cheerio = require("cheerio");

const SeriesScraper = async (req, res) => {
  if (req.method === "POST") {
    const scrapeURL = req.body.queryURL.split("&")[0];
    console.log(scrapeURL);
    try {
      const response = await fetch(`${scrapeURL}`, {
        method: "GET",
        headers: new Headers({
          "User-Agent":
            process.env.NEXT_PUBLIC_USER_AGENT ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
        }),
      });
      const htmlString = await response.text();
      const $ = cheerio.load(htmlString);
      const title = $("div.responsiveSeriesHeader__title > h1").text();
      const works = $(
        "div.responsiveSeriesHeader__subtitle.u-paddingBottomSmall"
      ).text();
      const desc = $("div.expandableHtml > span").html();
      const books = $(
        "div.gr-col-md-8 > div.gr-boxBottomDivider > div > div.listWithDividers > div.listWithDividers__item"
      )
        .map((i, el) => {
          const $el = $(el);
          const bookNumber = $el.find("h3.gr-h3.gr-h3--noBottomMargin").text();
          const cover = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.objectLockupContent__media > div.responsiveBook__media > a > img"
            )
            .attr("src")
            .replace("._SY180_", "");
          const title = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > a > span[itemprop = 'name']"
            )
            .text();
          const bookURL = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > a"
            )
            .attr("href");
          const author = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > div.u-paddingBottomTiny > span[itemprop = 'author'] > span[itemprop = 'name'] > a"
            )
            .text();
          const authorURL = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > div.u-paddingBottomTiny > span[itemprop = 'author'] > span[itemprop = 'name'] > a"
            )
            .attr("href");
          const rating = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > div.communityRating > span"
            )
            .text();
          /*           const desc = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.objectLockupContent__secondary > div > div.expandableHtml > span"
            )
            .text(); */
          const id = i + 1;
          return {
            id: id,
            cover: cover,
            bookNumber: bookNumber,
            title: title,
            bookURL: bookURL,
            author: author,
            authorURL: authorURL,
            rating: rating,
          };
        })
        .toArray();

      const moreBooks = $(
        "div.gr-col-md-8 > div[data-react-class = 'ReactComponents.SeriesList'] > div.listWithDividers > div.listWithDividers__item"
      )
        .map((i, el) => {
          const $el = $(el);
          const bookNumber = $el.find("h3.gr-h3.gr-h3--noBottomMargin").text();
          const cover = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.objectLockupContent__media > div.responsiveBook__media > a > img"
            )
            .attr("src")
            .replace("._SX120_", "")
            .replace("._SY180_", "");
          const title = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > a > span[itemprop = 'name']"
            )
            .text();
          const bookURL = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > a"
            )
            .attr("href");
          const author = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > div.u-paddingBottomTiny > span[itemprop = 'author'] > span[itemprop = 'name'] > a"
            )
            .text();
          const authorURL = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > div.u-paddingBottomTiny > span[itemprop = 'author'] > span[itemprop = 'name'] > a"
            )
            .attr("href");
          const rating = $el
            .find(
              "div.responsiveBook > div.objectLockupContent > div.u-paddingBottomXSmall > div.communityRating > span"
            )
            .text();
          /*           const desc = $el
              .find(
                "div.responsiveBook > div.objectLockupContent > div.objectLockupContent__secondary > div > div.expandableHtml > span"
              )
              .text(); */
          const id = i + 1;
          return {
            id: id,
            cover: cover,
            bookNumber: bookNumber,
            title: title,
            bookURL: bookURL,
            author: author,
            authorURL: authorURL,
            rating: rating,
          };
        })
        .toArray();
      const lastScraped = new Date().toISOString();
      res.statusCode = 200;
      return res.json({
        status: "Success",
        source: "https://github.com/nesaku/biblioreads",
        scrapeURL: scrapeURL,
        title: title,
        works: works,
        desc: desc,
        books: books,
        moreBooks: moreBooks,
        lastScraped: lastScraped,
      });
    } catch (error) {
      res.statusCode = 404;
      console.error("An Error Has Occured");
      return res.json({
        status: "Error - Invalid Query",
        scrapeURL: scrapeURL,
      });
    }
  }
};

export default SeriesScraper;