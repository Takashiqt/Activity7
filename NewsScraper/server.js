const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes with specific options
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Server is running' });
});

// Scraping endpoint
app.post('/api/scrape', async (req, res) => {
  console.log('Scrape endpoint hit');
  const { url } = req.body;
  
  if (!url) {
    console.log('No URL provided');
    return res.status(400).json({ error: 'URL is required' });
  }

  console.log('Scraping URL:', url);

  try {
    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      console.log('Invalid URL format:', url);
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log('Fetching content from:', url);

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

    // First try to get the page content
    const response = await axios.get(url, { 
      headers,
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });

    console.log('Response status:', response.status);

    if (response.status === 403) {
      return res.status(403).json({ 
        error: 'Access to this website is forbidden. The website might be blocking scraping attempts.' 
      });
    }

    if (response.status !== 200) {
      return res.status(response.status).json({ 
        error: `Failed to fetch the website. Status code: ${response.status}` 
      });
    }

    const $ = cheerio.load(response.data);
    const newsItems = [];
    const articlePromises = [];

    // Website-specific selectors
    const websiteSelectors = {
      'abs-cbn.com': {
        article: [
          '.news-item', 
          '.article-item', 
          '.news-card', 
          '.story-card', 
          'article',
          '.news-list-item',
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

    // Get the hostname to determine which selectors to use
    const hostname = new URL(url).hostname;
    const selectors = websiteSelectors[hostname] || websiteSelectors.default;

    console.log('Using selectors for:', hostname);

    // First, collect all article links
    const articleLinks = new Set();
    
    // Try to find articles using the selectors
    selectors.article.forEach(articleSelector => {
      $(articleSelector).each((_, element) => {
        const $element = $(element);
        // Try to find links in the article element
        const links = $element.find('a');
        links.each((_, link) => {
          const href = $(link).attr('href');
          if (href) {
            try {
              const absoluteUrl = href.startsWith('http') ? href : new URL(href, url).href;
              // Only add URLs that look like news articles
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
      console.log('No articles found with selectors, trying general approach...');
      $('a').each((_, link) => {
        const href = $(link).attr('href');
        if (href) {
          try {
            const absoluteUrl = href.startsWith('http') ? href : new URL(href, url).href;
            // Only add URLs that look like news articles
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

    console.log('Found', articleLinks.size, 'article links');

    // Process each article
    for (const articleUrl of articleLinks) {
      try {
        console.log('Fetching article:', articleUrl);
        const articleResponse = await axios.get(articleUrl, { 
          headers,
          timeout: 10000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        });

        if (articleResponse.status === 200) {
          const $article = cheerio.load(articleResponse.data);
          
          // Get title
          let title = '';
          selectors.title.forEach(selector => {
            const found = $article(selector).first().text().trim();
            if (found) title = found;
          });

          // If no title found, try to find any heading
          if (!title) {
            title = $article('h1, h2, h3, h4, h5, h6').first().text().trim();
          }

          // Get author
          let author = '';
          selectors.author.forEach(selector => {
            const found = $article(selector).first();
            if (found.length) {
              if (selector.startsWith('meta')) {
                const content = found.attr('content');
                if (content) author = content;
              } else {
                const text = found.text().trim();
                if (text) author = text;
              }
            }
          });

          // Get date
          let date = '';
          selectors.date.forEach(selector => {
            const found = $article(selector).first();
            if (found.length) {
              if (selector.startsWith('meta')) {
                const content = found.attr('content');
                if (content) date = content;
              } else {
                const text = found.text().trim();
                if (text) date = text;
              }
            }
          });

          // Format date
          let formattedDate = '';
          if (date) {
            try {
              // Try to parse the date string
              const dateObj = new Date(date);
              if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toISOString();
              } else {
                // Try to extract date from common formats
                const dateMatch = date.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
                if (dateMatch) {
                  const extractedDate = new Date(dateMatch[0]);
                  if (!isNaN(extractedDate.getTime())) {
                    formattedDate = extractedDate.toISOString();
                  }
                }
              }
            } catch (e) {
              console.log('Error formatting date:', date);
            }
          }

          // Get image
          let imageUrl = '';
          selectors.image.forEach(selector => {
            const img = $article(selector).first();
            if (img.length) {
              // Try different image attributes
              const possibleSrcs = [
                img.attr('src'),
                img.attr('data-src'),
                img.attr('data-lazy-src'),
                img.attr('data-original'),
                img.attr('data-url'),
                img.attr('data-srcset')?.split(',')[0]?.trim().split(' ')[0]
              ];

              for (const src of possibleSrcs) {
                if (src && !src.startsWith('data:') && !src.includes('svg')) {
                  try {
                    const absoluteUrl = src.startsWith('http') ? src : new URL(src, articleUrl).href;
                    // Verify it's an image URL
                    if (absoluteUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
                      imageUrl = absoluteUrl;
                      break;
                    }
                  } catch (e) {
                    console.log('Invalid image URL:', src);
                  }
                }
              }
            }
          });

          // If no image found with specific selectors, try to find any image in the article
          if (!imageUrl) {
            const imgs = $article('img');
            for (let i = 0; i < imgs.length; i++) {
              const img = imgs[i];
              const possibleSrcs = [
                $article(img).attr('src'),
                $article(img).attr('data-src'),
                $article(img).attr('data-lazy-src'),
                $article(img).attr('data-original'),
                $article(img).attr('data-url'),
                $article(img).attr('data-srcset')?.split(',')[0]?.trim().split(' ')[0]
              ];

              for (const src of possibleSrcs) {
                if (src && !src.startsWith('data:') && !src.includes('svg')) {
                  try {
                    const absoluteUrl = src.startsWith('http') ? src : new URL(src, articleUrl).href;
                    // Verify it's an image URL
                    if (absoluteUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
                      imageUrl = absoluteUrl;
                      break;
                    }
                  } catch (e) {
                    console.log('Invalid image URL:', src);
                  }
                }
              }
              if (imageUrl) break;
            }
          }

          if (title) {
            newsItems.push({
              title,
              author: author || 'Unknown',
              date: formattedDate || new Date().toISOString(),
              source: hostname,
              url: articleUrl,
              imageUrl: imageUrl || null
            });
          }
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      }
    }

    console.log('Found', newsItems.length, 'articles');

    if (newsItems.length === 0) {
      return res.status(404).json({ 
        error: 'No news articles found. The website might use a different structure or dynamic loading.' 
      });
    }

    res.json({ news: newsItems });
  } catch (error) {
    console.error('Error scraping:', error);
    
    if (error.response) {
      res.status(error.response.status).json({ 
        error: `Server responded with status ${error.response.status}` 
      });
    } else if (error.request) {
      res.status(500).json({ 
        error: 'No response received from the website. Please check the URL and try again.' 
      });
    } else {
      res.status(500).json({ 
        error: 'Error setting up the request. Please try again.' 
      });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Test the server at http://localhost:${port}/api/test`);
}); 