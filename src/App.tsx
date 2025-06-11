import React, { useState, useEffect } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Chip,
  Paper,
  CardMedia,
  CardActions,
  AppBar,
  Toolbar,
  InputAdornment,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import axios from 'axios';
import LinkIcon from '@mui/icons-material/Link';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import logo from './assets/logo.png';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import GitHubIcon from '@mui/icons-material/GitHub';
import FacebookIcon from '@mui/icons-material/Facebook';
import LanguageIcon from '@mui/icons-material/Language';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions' 
  : 'http://localhost:5000/api';

interface NewsItem {
  title: string;
  author: string;
  date: string;
  source: string;
  url: string;
  imageUrl: string | null;
  content?: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  request?: any;
  message: string;
}

// Define the theme colors
const theme = {
  background: '#fafafa',
  surface: '#ffffff',
  surfaceHover: '#f5f5f5',
  primary: '#2563eb',
  secondary: '#1d4ed8',
  accent: '#3b82f6',
  text: {
    primary: '#1f2937',
    secondary: '#4b5563',
    disabled: '#9ca3af'
  },
  divider: '#e5e7eb',
  scrollbar: {
    track: 'transparent',
    thumb: '#e5e7eb',
    thumbHover: '#d1d5db'
  },
  gradient: {
    primary: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    surface: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
  },
  shadow: {
    small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    large: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
  }
};

function App() {
  const [url, setUrl] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [error, setError] = useState<string>('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const newsUrls = [
    {
      name: 'ABS-CBN News',
      url: 'https://news.abs-cbn.com/',
      description: 'Philippine news and current events'
    },
    {
      name: 'GMA News',
      url: 'https://www.gmanetwork.com/news/',
      description: 'Latest Philippine news'
    },
    {
      name: 'Rappler',
      url: 'https://www.rappler.com/',
      description: 'Philippine news and analysis'
    },
    {
      name: 'Inquirer',
      url: 'https://newsinfo.inquirer.net/',
      description: 'Philippine daily news'
    },
    {
      name: 'Manila Bulletin',
      url: 'https://mb.com.ph/',
      description: 'Philippine news and information'
    },
    {
      name: 'CNN Philippines',
      url: 'https://www.cnnphilippines.com/',
      description: 'Latest news and updates'
    }
  ];

  useEffect(() => {
    // Check if server is running
    const checkServer = async () => {
      try {
        console.log('Checking server status...');
        const response = await axios.get(`${API_BASE_URL}/test`);
        console.log('Server response:', response.data);
        setServerStatus('online');
      } catch (error) {
        console.error('Server check failed:', error);
        setServerStatus('offline');
        setError('Server is offline. Please make sure the server is running on port 5000.');
      }
    };

    checkServer();
  }, []);

  const scrapeNews = async () => {
    if (!url) {
      setError('Please enter a website URL');
      return;
    }

    setLoading(true);
    setError('');
    setNews([]);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/scrape`);
      const response = await axios.post(`${API_BASE_URL}/scrape`, { url });
      console.log('Received response:', response.data);
      
      if (response.data.news && response.data.news.length > 0) {
        setNews(response.data.news);
      } else {
        setError('No news articles found. The website might use a different structure or dynamic loading.');
      }
    } catch (error) {
      console.error('Error scraping news:', error);
      const apiError = error as ApiError;
      
      if (apiError.response) {
        console.error('Error response:', apiError.response.data);
        setError(apiError.response.data?.error || 'Failed to scrape news. Please try a different URL.');
      } else if (apiError.request) {
        setError('No response from server. Please make sure the server is running.');
      } else {
        setError('Error: ' + apiError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedNews = news
    .filter(item => 
      filterKeyword === '' || 
      item.title.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      item.author.toLowerCase().includes(filterKeyword.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <Box sx={{ 
      bgcolor: theme.background,
      minHeight: '100vh',
      color: theme.text.primary,
      backgroundImage: 'radial-gradient(at 100% 0%, rgba(37, 99, 235, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(37, 99, 235, 0.05) 0px, transparent 50%)'
    }}>
      <AppBar position="fixed" elevation={0} sx={{ 
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${theme.divider}`,
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <NewspaperIcon sx={{ 
              color: theme.primary, 
              fontSize: 32,
              filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.2))'
            }} />
            <Typography variant="h5" component="h1" sx={{ 
              background: theme.gradient.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              letterSpacing: '-0.5px'
            }}>
              News Scraper
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="text"
              startIcon={<GitHubIcon />}
              href="https://github.com"
              target="_blank"
              sx={{ color: theme.text.secondary }}
            >
              GitHub
            </Button>
            {serverStatus === 'online' && (
              <Chip 
                label="Server Online" 
                color="success" 
                size="small"
                sx={{ 
                  height: '28px',
                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                  color: '#16a34a',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  '& .MuiChip-label': {
                    px: 1.5,
                    fontWeight: 500
                  }
                }}
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar /> {/* Spacer for fixed AppBar */}

      {/* Hero Section */}
      <Box sx={{ 
        background: theme.gradient.surface,
        borderBottom: `1px solid ${theme.divider}`,
        py: 12,
        mb: 6,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at top right, rgba(37, 99, 235, 0.1) 0%, transparent 50%)',
          zIndex: 0
        }
      }}>
        <Container maxWidth="xl">
          <Grid container spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={8} sx={{ mx: 'auto', textAlign: 'center' }}>
              <Typography variant="h2" sx={{ 
                fontWeight: 800,
                mb: 3,
                background: theme.gradient.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2
              }}>
                Discover News Instantly
              </Typography>
              <Typography variant="h5" sx={{ 
                color: theme.text.secondary,
                mb: 6,
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: '800px',
                mx: 'auto'
              }}>
                Extract and analyze news articles from any website with our powerful scraping tool. Stay informed with the latest updates from your favorite sources.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                flexWrap: 'wrap',
                justifyContent: 'center',
                mb: 4
              }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => document.getElementById('scrape-section')?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{
                    px: 6,
                    py: 2,
                    borderRadius: 3,
                    background: theme.gradient.primary,
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                    fontSize: '1.1rem',
                    '&:hover': {
                      background: theme.secondary,
                      boxShadow: '0 6px 8px -1px rgba(37, 99, 235, 0.3)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  href="https://github.com"
                  target="_blank"
                  sx={{
                    px: 6,
                    py: 2,
                    borderRadius: 3,
                    borderColor: theme.primary,
                    color: theme.primary,
                    fontSize: '1.1rem',
                    '&:hover': {
                      borderColor: theme.secondary,
                      backgroundColor: 'rgba(37, 99, 235, 0.04)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Learn More
                </Button>
              </Box>
              <Box sx={{ 
                display: 'flex',
                gap: 4,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700,
                    color: theme.primary,
                    mb: 1
                  }}>
                    100+
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.text.secondary }}>
                    News Sources
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700,
                    color: theme.primary,
                    mb: 1
                  }}>
                    24/7
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.text.secondary }}>
                    Real-time Updates
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700,
                    color: theme.primary,
                    mb: 1
                  }}>
                    Fast
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.text.secondary }}>
                    Quick Results
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Left Sidebar */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper elevation={0} sx={{ 
              p: 3, 
              background: theme.gradient.surface,
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              border: `1px solid ${theme.divider}`,
              boxShadow: theme.shadow.medium,
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadow.large
              }
            }}>
              <Typography variant="h6" sx={{ 
                color: theme.text.primary,
                fontWeight: 600,
                mb: 1
              }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {newsUrls.map((newsUrl, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    startIcon={<LanguageIcon />}
                    onClick={() => setUrl(newsUrl.url)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderColor: theme.divider,
                      color: theme.text.secondary,
                      '&:hover': {
                        borderColor: theme.primary,
                        backgroundColor: 'rgba(37, 99, 235, 0.04)',
                        color: theme.primary
                      }
                    }}
                  >
                    {newsUrl.name}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper elevation={0} sx={{ 
              p: 4,
              background: theme.gradient.surface,
              borderRadius: 3,
              border: `1px solid ${theme.divider}`,
              boxShadow: theme.shadow.medium
            }} id="scrape-section">
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ 
                  mb: 3,
                  fontWeight: 600,
                  color: theme.text.primary
                }}>
                  Enter Website URL
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter news website URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon sx={{ color: theme.text.secondary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.primary,
                          borderWidth: 2
                        }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={scrapeNews}
                    disabled={loading}
                    sx={{
                      px: 4,
                      borderRadius: 2,
                      background: theme.gradient.primary,
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                      '&:hover': {
                        background: theme.secondary,
                        boxShadow: '0 6px 8px -1px rgba(37, 99, 235, 0.3)'
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Scrape'}
                  </Button>
                </Box>
              </Box>

              {/* Filter and Sort Controls */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 4,
                flexWrap: 'wrap'
              }}>
                <TextField
                  size="small"
                  placeholder="Filter by keyword"
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'white'
                    }
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
                    startAdornment={
                      <InputAdornment position="start">
                        <SortIcon sx={{ color: theme.text.secondary }} />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: 2,
                      backgroundColor: 'white'
                    }}
                  >
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* News Grid */}
              <Grid container spacing={3}>
                {filteredAndSortedNews.map((item, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={index}>
                    <Card sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadow.large
                      }
                    }}>
                      {item.imageUrl && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={item.imageUrl}
                          alt={item.title}
                          sx={{
                            objectFit: 'cover',
                            borderTopLeftRadius: 12,
                            borderTopRightRadius: 12
                          }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Typography variant="h6" sx={{ 
                          mb: 1,
                          fontWeight: 600,
                          color: theme.text.primary,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {item.author} • {new Date(item.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Source: {item.source}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedNews(item);
                            setIsPopupOpen(true);
                          }}
                          sx={{
                            color: theme.primary,
                            '&:hover': {
                              backgroundColor: 'rgba(37, 99, 235, 0.04)'
                            }
                          }}
                        >
                          Read More
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mt: 3,
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      color: '#ef4444'
                    }
                  }}
                >
                  {error}
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* News Details Popup */}
      <Dialog
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadow.large
          }
        }}
      >
        {selectedNews && (
          <>
            <DialogTitle sx={{ 
              p: 3,
              borderBottom: `1px solid ${theme.divider}`
            }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {selectedNews.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedNews.author} • {new Date(selectedNews.date).toLocaleDateString()}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              {selectedNews.imageUrl && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <img 
                    src={selectedNews.imageUrl} 
                    alt={selectedNews.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />
                </Box>
              )}
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedNews.content || 'Content not available'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Source: {selectedNews.source}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.divider}` }}>
              <Button
                onClick={() => window.open(selectedNews.url, '_blank')}
                startIcon={<LinkIcon />}
                sx={{
                  color: theme.primary,
                  '&:hover': {
                    backgroundColor: 'rgba(37, 99, 235, 0.04)'
                  }
                }}
              >
                View Original Article
              </Button>
              <Button
                onClick={() => setIsPopupOpen(false)}
                sx={{
                  color: theme.text.secondary,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Ethical Considerations Section */}
      <Box sx={{ 
        mt: 8,
        py: 6,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderTop: `1px solid ${theme.divider}`,
        borderBottom: `1px solid ${theme.divider}`
      }}>
        <Container maxWidth="xl">
          <Typography variant="h4" sx={{ 
            mb: 4,
            fontWeight: 700,
            textAlign: 'center',
            color: theme.text.primary
          }}>
            Ethical Considerations
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ 
                p: 3,
                height: '100%',
                borderRadius: 3,
                background: 'white',
                border: `1px solid ${theme.divider}`,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.primary }}>
                  When is Scraping Allowed?
                </Typography>
                <Typography variant="body1" sx={{ color: theme.text.secondary, mb: 2 }}>
                  Web scraping is generally allowed when:
                </Typography>
                <Box component="ul" sx={{ 
                  pl: 2,
                  color: theme.text.secondary,
                  '& li': { mb: 1 }
                }}>
                  <li>The website's terms of service permit it</li>
                  <li>You're accessing publicly available data</li>
                  <li>You're not bypassing authentication</li>
                  <li>You're not violating any copyright laws</li>
                  <li>You're respecting rate limits</li>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ 
                p: 3,
                height: '100%',
                borderRadius: 3,
                background: 'white',
                border: `1px solid ${theme.divider}`,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.primary }}>
                  Respecting robots.txt
                </Typography>
                <Typography variant="body1" sx={{ color: theme.text.secondary, mb: 2 }}>
                  Always check and respect robots.txt files:
                </Typography>
                <Box component="ul" sx={{ 
                  pl: 2,
                  color: theme.text.secondary,
                  '& li': { mb: 1 }
                }}>
                  <li>Check for allowed/disallowed paths</li>
                  <li>Respect crawl-delay directives</li>
                  <li>Identify your scraper in User-Agent</li>
                  <li>Follow sitemap guidelines</li>
                  <li>Implement proper delays between requests</li>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ 
                p: 3,
                height: '100%',
                borderRadius: 3,
                background: 'white',
                border: `1px solid ${theme.divider}`,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.primary }}>
                  Legal Alternatives
                </Typography>
                <Typography variant="body1" sx={{ color: theme.text.secondary, mb: 2 }}>
                  Consider these legal alternatives:
                </Typography>
                <Box component="ul" sx={{ 
                  pl: 2,
                  color: theme.text.secondary,
                  '& li': { mb: 1 }
                }}>
                  <li>Official APIs and RSS feeds</li>
                  <li>News aggregator services</li>
                  <li>Data marketplaces</li>
                  <li>Public datasets</li>
                  <li>Partnership agreements</li>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: theme.text.secondary, mb: 2 }}>
              Remember: Always prioritize ethical data collection and respect website owners' rights.
            </Typography>
            <Button
              variant="outlined"
              href="https://www.robotstxt.org/"
              target="_blank"
              startIcon={<LanguageIcon />}
              sx={{
                borderRadius: 2,
                borderColor: theme.primary,
                color: theme.primary,
                '&:hover': {
                  borderColor: theme.secondary,
                  backgroundColor: 'rgba(37, 99, 235, 0.04)'
                }
              }}
            >
              Learn More About robots.txt
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        mt: 8,
        py: 6,
        background: theme.gradient.surface,
        borderTop: `1px solid ${theme.divider}`
      }}>
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <NewspaperIcon sx={{ color: theme.primary, fontSize: 28 }} />
                <Typography variant="h6" sx={{ 
                  color: theme.text.primary,
                  fontWeight: 600
                }}>
                  News Scraper
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: theme.text.secondary, mb: 2 }}>
                Extract and analyze news articles from any website with our powerful scraping tool.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <IconButton href="https://github.com" target="_blank" sx={{ color: theme.text.secondary }}>
                  <GitHubIcon />
                </IconButton>
                <IconButton href="https://facebook.com" target="_blank" sx={{ color: theme.text.secondary }}>
                  <FacebookIcon />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {newsUrls.slice(0, 4).map((newsUrl, index) => (
                  <Button
                    key={index}
                    variant="text"
                    onClick={() => setUrl(newsUrl.url)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      color: theme.text.secondary,
                      '&:hover': {
                        color: theme.primary,
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    {newsUrl.name}
                  </Button>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                About
              </Typography>
              <Typography variant="body2" sx={{ color: theme.text.secondary, mb: 2 }}>
                News Scraper is a powerful tool that helps you extract and analyze news articles from various websites. Stay informed with the latest news from your favorite sources.
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4 }} />
          <Typography variant="body2" sx={{ color: theme.text.secondary, textAlign: 'center' }}>
            © {new Date().getFullYear()} News Scraper. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default App;
