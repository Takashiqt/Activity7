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
  Divider
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
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceHover: '#f1f3f5',
  primary: '#1a73e8',
  secondary: '#185abc',
  text: {
    primary: '#202124',
    secondary: '#5f6368',
    disabled: '#9aa0a6'
  },
  divider: '#dadce0',
  scrollbar: {
    track: 'transparent',
    thumb: '#dadce0',
    thumbHover: '#bdc1c6'
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
      color: theme.text.primary
    }}>
      <AppBar position="fixed" elevation={0} sx={{ 
        bgcolor: theme.surface, 
        borderBottom: `1px solid ${theme.divider}`,
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NewspaperIcon sx={{ color: theme.primary, fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ 
              color: theme.primary,
              fontWeight: 600,
              letterSpacing: '-0.5px'
            }}>
              News Scraper
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {serverStatus === 'online' && (
            <Chip 
              label="Server Online" 
              color="success" 
              size="small"
              sx={{ 
                height: '24px',
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                color: '#4caf50',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          )}
        </Toolbar>
      </AppBar>

      <Toolbar /> {/* Spacer for fixed AppBar */}

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Left Sidebar */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper elevation={0} sx={{ 
              p: 3, 
              bgcolor: theme.surface,
              borderRadius: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              border: `1px solid ${theme.divider}`
            }}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: theme.text.primary, 
                  mb: 2,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <LinkIcon sx={{ color: theme.primary }} />
                  Scrape Settings
                </Typography>
                <TextField
                  fullWidth
                  label="Enter Website URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g., https://news.abs-cbn.com/"
                  disabled={loading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  onClick={scrapeNews}
                  disabled={loading || !url}
                  fullWidth
                  sx={{ 
                    mb: 2,
                    bgcolor: theme.primary,
                    color: '#fff',
                    py: 1.2,
                    '&:hover': {
                      bgcolor: theme.secondary,
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Scrape News'}
                </Button>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: theme.text.primary, 
                  mb: 2,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <FilterListIcon sx={{ color: theme.primary }} />
                  Filter & Sort
                </Typography>
                <TextField
                  fullWidth
                  label="Filter by keyword"
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  placeholder="e.g., technology, politics"
                  disabled={news.length === 0}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl fullWidth disabled={news.length === 0}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
                    startAdornment={
                      <InputAdornment position="start">
                        <SortIcon color="action" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Divider />

              <Box sx={{ mt: 'auto' }}>
                <Typography variant="subtitle1" sx={{ 
                  color: theme.text.primary,
                  fontWeight: 500,
                  mb: 2
                }}>
                  Popular News Sources
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {newsUrls.map((item, index) => (
                    <Button
                      key={index}
                      variant="text"
                      onClick={() => setUrl(item.url)}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        color: theme.text.secondary,
                        py: 1,
                        '&:hover': {
                          bgcolor: theme.surfaceHover,
                          color: theme.primary
                        }
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8} lg={9}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress sx={{ color: theme.primary }} />
              </Box>
            )}

            {!loading && news.length > 0 && (
              <Grid container spacing={3}>
                {filteredAndSortedNews.map((item, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={index}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      bgcolor: theme.surface,
                      border: `1px solid ${theme.divider}`,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3,
                        bgcolor: theme.surfaceHover
                      }
                    }}>
                      {item.imageUrl && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={item.imageUrl}
                          alt={item.title}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography variant="h6" component="h2" sx={{ 
                          color: theme.text.primary,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          lineHeight: 1.4
                        }}>
                          {item.title}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 0.5,
                          mt: 1
                        }}>
                          {item.author && (
                            <Typography variant="body2" sx={{ 
                              color: theme.text.secondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <strong>Author:</strong> {item.author}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ 
                            color: theme.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            <strong>Date:</strong> {new Date(item.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: theme.text.disabled,
                            fontSize: '0.875rem',
                            mt: 0.5
                          }}>
                            Source: {item.source}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button 
                          size="small" 
                          href={item.url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            color: theme.primary,
                            '&:hover': {
                              color: theme.secondary
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
            )}

            {!loading && news.length === 0 && !error && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: theme.surface,
                  borderRadius: 2,
                  border: `1px solid ${theme.divider}`
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No News Articles Found
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Enter a news website URL above to start scraping articles.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
