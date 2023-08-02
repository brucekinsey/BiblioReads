const cheerio = require("cheerio");

const BookScraper = async (req, res) => {
  if (req.method === "POST") {
    const scrapeURL = req.body.queryURL.split("?")[0];
    try {
      const response = await fetch(`${scrapeURL}`, {
        method: "GET",
        headers: new Headers({
          "User-Agent":
            process.env.NEXT_PUBLIC_USER_AGENT ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
        }),
      });
      const responseStatus = await response.status;
      const htmlString = await response.text();
      // Uncomment below for development
      // console.log(responseStatus);
      const $ = cheerio.load(htmlString);

      // Adding script data scraped from page
      const scriptData = JSON.parse($('script#__NEXT_DATA__[type="application/json"]').html()).props.pageProps.apolloState;
      
      // if it's not ready, i.e. page has a <title>Loading interface...</title>,
      // return 504 b/c the page isn't finished loading
      if(Object.keys(scriptData).length === 0){
        res.statusCode = 504;
        return res.json({
          status: "Processing Query",
          scrapeURL: scrapeURL,
        });
      }

      // Now that it's loaded, renaming properties in scriptData
      // It's probably computationally faster to just assign them to a new variable
      const reviewArray = [];

      Array.from(Object.keys(scriptData)).forEach( e =>
        {
          e.toLowerCase().indexOf('work:') >= 0 ?
            (
              delete Object.assign(scriptData, { 'Work': scriptData[e] })[e],
              Array.from(Object.keys(scriptData['Work'])).forEach(e =>
                {
                  e.toLowerCase().indexOf('quotes({') >= 0 ?
                    delete Object.assign(scriptData['Work'], { 'quotes': scriptData['Work'][e] })[e] :
                  e.toLowerCase().indexOf('questions({') >= 0 ?
                    delete Object.assign(scriptData['Work'], { 'questions': scriptData['Work'][e] })[e] :
                  e.toLowerCase().indexOf('topics({') >= 0 ?
                    delete Object.assign(scriptData['Work'], { 'topics': scriptData['Work'][e] })[e] : null;
                }
              )
            ) :
          e.toLowerCase().indexOf('series:') >= 0 ?
            delete Object.assign(scriptData, { 'Series': scriptData[e] })[e] :
          e.toLowerCase().indexOf('book:') >= 0 ?
            delete Object.assign(scriptData, { 'Book': scriptData[e] })[e] :
          e.toLowerCase().indexOf('review:') >= 0 ?
            reviewArray.push(scriptData[e]) :
          null;
        }
      );

      // For readability...
      const grBook          = scriptData['Book'];
      const grSeries        = scriptData['Series'] ? scriptData['Series'] : {"webUrl": ""};
      const grWork          = scriptData['Work'];

      // Placed in order of order by variable and 1st level property
      const cover           = grBook['imageUrl'];
      const desc            = grBook["description({\"stripped\":true})"];
      const genres          = grBook['bookGenres'].map(e => {return e.genre.name});
      const bookLanguage    = grBook["details"]["language"]["name"]
      const bookEdition     = grBook["details"]["numPages"].toLocaleString() + " pages, " + grBook["details"]["format"];
      const title           = grBook["title"];

      const seriesURL       = grSeries['webUrl'];

      const workURL         = grWork['details']['webUrl'];
      const publishDate     = new Date(grWork['details']['publicationTime'])
                                .toLocaleDateString(undefined,{ year: 'numeric', month: 'long', day: 'numeric' });
      const rating          = grWork['stats']['averageRating'].toString();
      const ratingCount     = grWork['stats']["ratingsCount"].toLocaleString() + " ";
      const reviewsCount    = grWork['stats']["textReviewsCount"].toLocaleString() + " reviews";
      const [rating1, rating2, rating3, rating4, rating5] = grWork["stats"]["ratingsCountDist"];
      const reviewBreakdown = {
                                rating5: rating5.toLocaleString(),
                                rating4: rating4.toLocaleString(),
                                rating3: rating3.toLocaleString(),
                                rating2: rating2.toLocaleString(),
                                rating1: rating1.toLocaleString(),
                              };
      const questions       = grWork["questions"]["totalCount"].toString();
      const questionsURL    = grWork["questions"]["webUrl"];
      const quotes          = grWork["quotes"]["totalCount"].toString();
      const quotesURL       = grWork["quotes"]["webUrl"];

      const reviews = reviewArray.map((e, i) => {
        const reviewData = e;
        const userId = e['creator']['__ref'];
        const userData = scriptData[userId];
        const author = userData.name;
        const image = userData.imageUrlSquare !== undefined ? userData.imageUrlSquare : null ;
        const text = reviewData["text"].toString();
        const date = new Date(reviewData.lastRevisionAt)
          .toLocaleDateString(undefined,{ year: 'numeric', month: 'long', day: 'numeric' });
        const stars = "Rating " + reviewData["rating"].toString() + " out of 5";
        const likes = reviewData["likeCount"].toLocaleString() + " likes";
        const id = i + 1;
        const returnValue = {
          id: id,
          image: image,
          author: author,
          date: date,
          stars: stars,
          text: text,
          likes: likes,
        };
        return returnValue;
      });

      // Existing const declarations from @nesaku's code, have not yet moved scraping it from the JSON, though the data is present
      // Undecided if I'll leave it in place or not -BK
      const series = $("h3.Text__italic").text();
      const author = $(".ContributorLinksList > span > a")
        .map((i, el) => {
          const $el = $(el);
          const name = $el.find("span").text();
          const url = $el.attr("href").replace("https://www.goodreads.com", "");
          const id = i + 1;
          return {
            id: id,
            name: name,
            url: url,
          };
        })
        .toArray();
      const related = $("div.DynamicCarousel__itemsArea > div > div")
        .map((i, el) => {
          const $el = $(el);
          const title = $el
            .find('div > a > div:nth-child(2) > [data-testid="title"]')
            .html();
          const author = $el
            .find('div > a > div:nth-child(2) > [data-testid="author"]')
            .html();
          const src = $el
            .find("div > a > div:nth-child(1) > div > div > img")
            .attr("src");
          const url = $el
            .find("div > a")
            .attr("href")
            .replace("https://www.goodreads.com", "");
          const id = i + 1;
          return {
            id: id,
            src: src,
            title: title,
            author: author,
            url: url,
          };
        })
        .toArray();

      const lastScraped = new Date().toISOString();
      {
        title === "" ? (res.statusCode = 504) : (res.statusCode = 200);
      }
      
      return res.json({
        status: "Received",
        statusCode: res.statusCode,
        source: "https://github.com/nesaku/biblioreads",
        scrapeURL: scrapeURL,
        cover: cover,
        series: series,
        seriesURL: seriesURL,
        workURL: workURL,
        title: title,
        author: author,
        rating: rating,
        ratingCount: ratingCount,
        reviewsCount: reviewsCount,
        desc: desc,
        genres: genres,
        bookEdition: bookEdition,
        publishDate: publishDate,
        related: related,
        reviewBreakdown: reviewBreakdown,
        reviews: reviews,
        quotes: quotes,
        quotesURL: quotesURL,
        questions: questions,
        questionsURL: questionsURL,
        lastScraped: lastScraped,
      });
    } catch (error) {
      res.statusCode = 404;
      console.error("An Error Has Occurred");
      console.error(error.toString());
      return res.json({
        status: "Error - Invalid Query",
        scrapeURL: scrapeURL,
      });
    }
  } else {
    res.statusCode = 405;
    return res.json({
      status: "Error 405 - Method Not Allowed",
    });
  }
};

export default BookScraper;
