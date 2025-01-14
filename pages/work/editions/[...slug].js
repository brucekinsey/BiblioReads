import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../../components/global/Header";
import Footer from "../../../components/global/Footer";
import Loader from "../../../components/global/Loader";
import ErrorMessage from "../../../components/global/ErrorMessage";
import EditionsResultData from "../../../components/editionspage/EditionsResultData";

const Slug = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [scrapedData, setScrapedData] = useState({});
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/works/editions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          queryURL: `https://www.goodreads.com/work/editions/${slug}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setScrapedData(data);
      } else {
        setError(true);
      }
    };
    if (slug) {
      fetchData();
    }
  }, [slug]);

  return (
    <div>
      <div className="bg-gradient-to-tr from-rose-50 to-rose-200 dark:bg-gradientedge text-gray-900 dark:text-gray-100 min-h-screen">
        <Header />
        {/* Show loader or error based on the scraper data response */}
        {error && (
          <ErrorMessage
            status="500"
            url={`https://www.goodreads.com/work/editions/${slug}`}
          />
        )}
        {!error && (
          <>
            {scrapedData.book === undefined && <Loader other={true} />}
            {scrapedData.error && (
              <ErrorMessage
                status="404"
                url={`https://www.goodreads.com/work/editions/${slug}`}
              />
            )}

            {scrapedData.editions && scrapedData.book.length === 0 && (
              <ErrorMessage
                status="ScraperError"
                url={`https://www.goodreads.com/work/editions/${slug}`}
              />
            )}
            {scrapedData && <EditionsResultData scrapedData={scrapedData} />}
          </>
        )}
        <Footer />
      </div>
    </div>
  );
};

export default Slug;
