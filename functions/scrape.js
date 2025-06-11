const axios = require('axios');
const cheerio = require('cheerio');

// Website-specific selectors
const websiteSelectors = {
  'abs-cbn.com': {
    article: [
      '.news-item', 
      '.article-item', 
      '.news-card', 
      '.story-card', 
      'article',
      '.news-list__item',
      '.news-list__article',
      '.news-list__card',
      '.news-list__story',
      '.news-list__content',
      '.news-list__wrapper',
      '.news-list__container',
      '.news-list__grid',
      '.news-list__row',
      '.news-list__col',
      '.news-list__box',
      '.news-list__panel',
      '.news-list__block',
      '.news-list__section'
    ],
    title: [
      '.news-title', 
      '.article-title', 
      '.story-title', 
      'h2', 
      'h3', 
      'h1',
      '.news-list__title',
      '.news-list__headline',
      '.news-list__heading',
      '.news-list__name',
      '.news-list__label',
      '.news-list__text',
      '.news-list__content h1',
      '.news-list__content h2',
      '.news-list__content h3',
      '.news-list__content h4',
      '.news-list__content h5',
      '.news-list__content h6'
    ],
    author: [
      '.author', 
      '.byline', 
      '.writer', 
      '.article-author',
      'span[itemprop="author"]', 
      'span.author', 
      'div.author',
      'meta[name="author"]', 
      'meta[property="article:author"]',
      '.news-list__author',
      '.news-list__byline',
      '.news-list__writer',
      '.news-list__contributor',
      '.news-list__reporter',
      '.news-list__journalist'
    ],
    date: [
      '.date', 
      '.timestamp', 
      '.article-date', 
      '.publish-date',
      'time', 
      'span[itemprop="datePublished"]', 
      'span.date',
      'meta[name="pubdate"]', 
      'meta[property="article:published_time"]',
      '.news-list__date',
      '.news-list__time',
      '.news-list__timestamp',
      '.news-list__published',
      '.news-list__posted',
      '.news-list__updated'
    ],
    image: [
      'img.news-image', 
      'img.article-image', 
      'img.story-image', 
      '.news-image img', 
      '.article-image img', 
      '.story-image img',
      '.news-list__image img',
      '.news-list__photo img',
      '.news-list__thumbnail img',
      '.news-list__media img',
      '.news-list__picture img',
      '.news-list__illustration img',
      '.news-list__graphic img',
      '.news-list__banner img',
      '.news-list__cover img'
    ]
  },
  'default': {
    article: ['article', '.article', '.post', '.news-item', '.story', '.news-story', '.news-article', '.content', '.main-content'],
    title: ['h1', 'h2', '.title', '.headline', '.story-title', '.article-title', 'h3'],
    author: [
      '.author', '.byline', '.writer', '.author-name', '.article-author', '.contributor',
      'span[itemprop="author"]', 'span.author', 'div.author',
      'meta[name="author"]', 'meta[property="article:author"]'
    ],
    date: [
      '.date', '.published', '.timestamp', 'time', '.article-date', '.publish-date', '.posted-on',
      'span[itemprop="datePublished"]', 'span.date',
      'meta[name="pubdate"]', 'meta[property="article:published_time"]'
    ],
    image: ['img.featured-image', 'img.article-image', 'img.news-image', '.featured-image img', '.article-image img', '.news-image img', 'img[src*="news"]', 'img[src*="article"]']
  }
};

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { url } = JSON.parse(event.body);
    
    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid URL format' })
      };
    }

    // Add headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Fetch the page content
    const response = await axios.get(url, { 
      headers,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });

    if (response.status === 403) {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'Access to this website is forbidden. The website might be blocking scraping attempts.' 
        })
      };
    }

    if (response.status !== 200) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: `Failed to fetch the website. Status code: ${response.status}` 
        })
      };
    }

    const $ = cheerio.load(response.data);
    const newsItems = [];
    const articleLinks = new Set();

    // Get the hostname to determine which selectors to use
    const hostname = new URL(url).hostname;
    const selectors = websiteSelectors[hostname] || websiteSelectors.default;

    // Find articles using the selectors
    selectors.article.forEach(articleSelector => {
      $(articleSelector).each((_, element) => {
        const $element = $(element);
        const links = $element.find('a');
        links.each((_, link) => {
          const href = $(link).attr('href');
          if (href) {
            try {
              const absoluteUrl = href.startsWith('http') ? href : new URL(href, url).href;
              if (absoluteUrl.includes('/news/') || 
                  absoluteUrl.includes('/article/') || 
                  absoluteUrl.includes('/story/') ||
                  absoluteUrl.match(/\d{4}\/\d{2}\/\d{2}/)) {
                articleLinks.add(absoluteUrl);
              }
            } catch (e) {
              console.log('Invalid article URL:', href);
            }
          }
        });
      });
    });

    // If no articles found with selectors, try a more general approach
    if (articleLinks.size === 0) {
      $('a').each((_, link) => {
        const href = $(link).attr('href');
        if (href) {
          try {
            const absoluteUrl = href.startsWith('http') ? href : new URL(href, url).href;
            if (absoluteUrl.includes('/news/') || 
                absoluteUrl.includes('/article/') || 
                absoluteUrl.includes('/story/') ||
                absoluteUrl.match(/\d{4}\/\d{2}\/\d{2}/)) {
              articleLinks.add(absoluteUrl);
            }
          } catch (e) {
            console.log('Invalid article URL:', href);
          }
        }
      });
    }

    // Convert Set to Array and limit to 10 articles
    const limitedLinks = Array.from(articleLinks).slice(0, 10);

    // Process each article link
    for (const articleUrl of limitedLinks) {
      try {
        const articleResponse = await axios.get(articleUrl, { headers });
        const $article = cheerio.load(articleResponse.data);

        let title = '';
        let author = '';
        let date = '';
        let image = '';

        // Extract title
        for (const selector of selectors.title) {
          const titleElement = $article(selector).first();
          if (titleElement.length) {
            title = titleElement.text().trim();
            break;
          }
        }

        // Extract author
        for (const selector of selectors.author) {
          const authorElement = $article(selector).first();
          if (authorElement.length) {
            author = authorElement.text().trim();
            break;
          }
        }

        // Extract date
        for (const selector of selectors.date) {
          const dateElement = $article(selector).first();
          if (dateElement.length) {
            date = dateElement.text().trim();
            break;
          }
        }

        // Extract image
        for (const selector of selectors.image) {
          const imageElement = $article(selector).first();
          if (imageElement.length) {
            image = imageElement.attr('src');
            if (image && !image.startsWith('http')) {
              image = new URL(image, articleUrl).href;
            }
            break;
          }
        }

        if (title) {
          newsItems.push({
            title,
            author,
            date,
            image,
            url: articleUrl
          });
        }
      } catch (error) {
        console.log(`Error processing article ${articleUrl}:`, error.message);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ articles: newsItems })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};