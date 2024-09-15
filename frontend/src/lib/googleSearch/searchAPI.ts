// import { fetch as hyperFetch } from 'hyper';

/**
 * Function to fetch and clean the content of a web page from a given URL
 */
async function fetchSiteContent(url: string): Promise<string> {
    try {
      const fdaDomains = ['https://www.fda.gov', 'https://fda.gov'];
      const isFdaDomain = fdaDomains.some(domain => url.startsWith(domain));
  
      if (!isFdaDomain) {
        return "Site content not available";
      }
  
      // Replace the FDA domain with our proxy path
      const proxyUrl = url.replace(/^https:\/\/(www\.)?fda\.gov/, '/fda-proxy');
  
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch content from ${url}`);
      }
  
      const html = await response.text();
  
      // Create a DOM parser to extract the <p> tags
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
  
      // Select all <p> elements and extract their text content
      const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent?.trim()).filter(text => text && text.length > 0);
      // Join the non-empty paragraphs with a space or newline as per your need
      return paragraphs.join('\n');
    } catch (error) {
      console.error('Error fetching site content:', error);
      return 'Failed to retrieve content';
    }
  }
  


/**
 * Main function to perform a custom search and scrape the results
 */
// export async function customSearch(query: string): Promise<{ title: string; link: string; snippet: string; site_content: string }[]> {
//   const apiKey: string = import.meta.env.VITE_GOOGLE_SEARCH_KEY;
//   const cx: string = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
//   const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}`;

//   try {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`Error: ${response.status} - ${response.statusText}`);
//     }

//     const data = await response.json();
//     const ans: { title: string; link: string; snippet: string; site_content: string }[] = [];

//     if (data.items) {
//       for (const item of data.items) {
//         const siteContent = await fetchSiteContent(item.link); // Scraping the content of the link
//         ans.push({
//           title: item.title,
//           link: item.link,
//           snippet: item.snippet,
//           site_content: siteContent, // Adding the cleaned site content
//         });
//       }
//       //here  Math.floor(JSON.stringfy(ans).length/4) should be less that 240,000, if it is not then reduce the size of the site contetn by cuttin text from item.site_content for each item in site  eaquallu from top and bottom to maintain the main parts accordingly
//       //how much you cut should be dependent on the  JSON.stringfy(ans).length right now because we want to maintain the maximum possible amount of info, if the site_coontent is too small to remove stuff from it is let it be the remove more text from other
//       // please complete this TASL
//       return ans;
//     } else {
//       console.log('No results found.');
//       return [];
//     }
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     return [];
//   }
// }
export async function customSearch(query: string, num_results:number=10): Promise<{ title: string; link: string; snippet: string; site_content: string }[]> {
    const apiKey: string = import.meta.env.VITE_GOOGLE_SEARCH_KEY;
    const cx: string = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=${num_results}`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      let ans: { title: string; link: string; snippet: string; site_content: string }[] = [];
  
      if (data.items) {
        for (const item of data.items) {
          const siteContent = await fetchSiteContent(item.link);
          ans.push({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            site_content: siteContent,
          });
        }
        const MAX_LENGTH = 210000
        while(JSON.stringify(ans).length > MAX_LENGTH){
            console.log("#####TRIMMING " , JSON.stringify(ans).length)
            let excess = JSON.stringify(ans).length - MAX_LENGTH
            let highest_index_with_site_content = ans.length -1
            for(var i = ans.length -1 ; i >= 0 ; i--){
                if (ans[i].site_content.length > 0){
                    highest_index_with_site_content=i
                    break
                }
            }
            if(ans[highest_index_with_site_content].site_content.length < excess) {
                ans[highest_index_with_site_content].site_content=""
            }else{
                ans[highest_index_with_site_content].site_content=ans[highest_index_with_site_content].site_content.substring(0, excess)
            }
        }
        
        return ans;
      } else {
        console.log('No results found.');
        return [];
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  }