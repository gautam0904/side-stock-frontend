import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import StoreIcon from '@mui/icons-material/Store';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import Divider from '@mui/material/Divider';
import UploadIcon from '@mui/icons-material/Upload';
import { useAuth } from '../../contexts/auth.contexts';
import PercentIcon from '@mui/icons-material/Percent';
import HomeIcon from '@mui/icons-material/Home';
import { GstContext } from '../../contexts/gst.contexts';
import { useSidebar } from '../../contexts/sidebar.context';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import CssBaseline from '@mui/material/CssBaseline';
import { useNavigate } from 'react-router-dom';
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import EmojiSymbolsIcon from '@mui/icons-material/EmojiSymbols';
import SummarizeIcon from '@mui/icons-material/Summarize';

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
}

const drawerWidth = 240;

const Navbar: React.FC<Props> = (props) => {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const { isNonGST, setIsNonGST } = React.useContext(GstContext);
  const { isOpen, setIsOpen } = useSidebar();
  const { isAuthenticated } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
    setIsOpen(!isOpen);
  };

  const container = window !== undefined ? () => window().document.body : undefined;

  const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

  const gstMenuItems = [
    { key: 'home', text: 'Home', icon: HomeIcon, path: '/dashboard'},
    { key: 'stocks', text: 'Stocks', icon: AutoStoriesIcon, path: '/stocks' },
    { key: 'add-sale', text: 'Add Sale', icon: PointOfSaleIcon, path: '/sales/new' },
    { key: 'add-purchase', text: 'Add Purchase', icon: DashboardCustomizeIcon, path: '/purchasesGST/new' },
    { key: 'add-new-customer', text: 'Add New Customer', icon: EmojiSymbolsIcon, path: '/customersGST/new' },
    { key: 'reports', text: 'Reports', icon: SummarizeIcon, path: '/reports' },
  ];

  const nonGstMenuItems = [
    { key: 'products', text: 'Products', icon: ProductionQuantityLimitsIcon, path: '/products' },
    { key: 'challan', text: 'Challan', icon: StoreIcon, path: '/challan' },
    { key: 'payment', text: 'Payment', icon: CurrencyRupeeIcon, path: '/payment' },
    { key: 'direct-bill', text: 'Direct Bill', icon: CurrencyBitcoinIcon, path: '/bill/new' },
    { key: 'customer-new', text: 'Add Customer', icon: PersonAddAltIcon, path: '/customerNonGST/new' },
  ];

  const navigate = useNavigate();

  const handleMenuClick = (key: string, path: string) => {
    navigate(path);
  };

  const handleProductClick = () => {
    navigate('/products');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Create FormData to handle multiple files
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // TODO: Add your upload API call here
      console.log('Uploading files:', formData);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't render navbar for non-authenticated users
  }

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        SP
      </Typography>
      <Divider />
      <Box sx={{ display: 'block', alignItems: 'center', flexGrow: 1 }}>
        <input
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          id="upload-files"
          onChange={handleFileUpload}
        />
        <label htmlFor="upload-files">
          <Button
            component="span"
            sx={{ color: 'inherit', ml: 2 }}
          >
            <UploadIcon sx={{ mr: 1 }} />
            Upload
          </Button>
        </label>
      </Box>
      <Divider />

      <List>
        {nonGstMenuItems.map((item, index) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton sx={{ textAlign: 'center' }}>
              <Button
                sx={{
                  bgcolor: '#7b4eff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  borderRadius: '4px',
                  width: '100%'
                }}
                onClick={() => handleMenuClick(item.key, item.path)}
              >
                <item.icon sx={{ mr: 1 }} />
                {item.text}
              </Button>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />

      <List sx={{ display: { xs: 'none', md: 'none', sm: 'block' }, alignItems: 'center', flexGrow: 1 }}>
        {gstMenuItems.map((item, index) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton sx={{ textAlign: 'center' }}>
              <Button
                sx={{
                  bgcolor: '#7b4eff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  borderRadius: '4px',
                  width: '100%'
                }}
                onClick={() => handleMenuClick(item.key, item.path)}
              >
                <item.icon sx={{ mr: 1 }} />
                {item.text}
              </Button>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'white' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ bgcolor: 'white' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>

            <Toolbar>
              <IconButton
                sx={{ bgcolor: '#7b4eff', borderRadius: '50%', width: '40px', height: '40px', flexGrow: 1, display: { xs: 'flex', sm: 'flex', alignItems: 'center' } }}
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            </Toolbar>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 1 }}>
              {gstMenuItems.map((item, index) => (
                <React.Fragment key={item.key}>
                  <Button
                    sx={{ bgcolor: '#7b4eff', color: 'white', display: 'flex', alignItems: 'center', px: 2 }}
                    onClick={() => handleMenuClick(item.key, item.path)}
                  >
                    <item.icon sx={{ mr: 1 }} />
                    {item.text}
                  </Button>
                  {index < gstMenuItems.length - 1 && (
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <nav>
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: false, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </Box>
  );
};

export default React.memo(Navbar);