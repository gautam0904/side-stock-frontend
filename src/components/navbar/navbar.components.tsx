import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import StoreIcon from '@mui/icons-material/Store';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import Divider from '@mui/material/Divider';
import UploadIcon from '@mui/icons-material/Upload'; 
import { useAuth } from '../../contexts/auth.contexts';
import PercentIcon from '@mui/icons-material/Percent';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

const gstMenuItems = [
  { key: 'stocks&reports', text: 'Stocks & Reports', icon: ReceiptIcon },
  { key: 'add-sale', text: 'Add Sale', icon: CategoryIcon },
  { key: 'add-purchase', text: 'Add Purchase', icon: StoreIcon },
  { key: 'add-new-customer', text: 'Add New Customer', icon: PersonAddAltIcon },
];

const nonGstMenuItems = [
  { key: 'stocks&price', text: 'Stocks & Price', icon: ReceiptIcon },
  { key: 'challan', text: 'Challan', icon: StoreIcon },
  { key: 'payment', text: 'Payment', icon: CategoryIcon },
  { key: 'direct-bill', text: 'Direct Bill', icon: PersonAddAltIcon },
];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [isNonGST, setIsNonGST] = React.useState(false);  // New state to handle GST/Non-GST toggle
  
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleToggleGST = () => {
    setIsNonGST(!isNonGST);
  };

  const handleMenuClick = (key: string) => {
    console.log(key);
  };

  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // Don't render navbar for non-authenticated users
  }

  const menuItems = isNonGST ? nonGstMenuItems : gstMenuItems;

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />

          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', flexGrow: 1 }}>
            <IconButton
              size="large"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Button
              sx={{ color: 'white', ml: 2 }}
              onClick={handleToggleGST}
            >
              <UploadIcon sx={{ mr: 1 }} />
              Upload
            </Button>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 1 }}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.key}>
                <Button
                  sx={{ color: 'white', display: 'flex', alignItems: 'center', px: 2 }}
                  onClick={() => handleMenuClick(item.key)}
                >
                  <item.icon sx={{ mr: 1 }} />
                  {item.text}
                </Button>
                {index < menuItems.length - 1 && (
                  <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                )}
              </React.Fragment>
            ))}
          </Box>

          {/* Right Section (Upload button in mobile, Sidebar in Desktop) */}
          <Box sx={{ flexGrow: 0, display: { xs: 'none', md: 'flex' } }}>
            <Button
              sx={{ color: 'white', display: 'flex', alignItems: 'center', px: 2 }}
              onClick={() => handleMenuClick('upload')}
            >
              
                {isNonGST ? <PercentIcon sx={{ mr: 1 }} />: <DoNotDisturbAltIcon sx={{ mr: 1 }} />  }
                {isNonGST ? 'GST' : 'Non-GST'}
            </Button>
          </Box>
          
          {/* Avatar Icon on Right */}
          <Box sx={{ flexGrow: 0 }}>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;





































// import * as React from 'react';
// import AppBar from '@mui/material/AppBar';
// import Box from '@mui/material/Box';
// import Toolbar from '@mui/material/Toolbar';
// import IconButton from '@mui/material/IconButton';
// import Typography from '@mui/material/Typography';
// import Menu from '@mui/material/Menu';
// import MenuIcon from '@mui/icons-material/Menu';
// import Container from '@mui/material/Container';
// import Avatar from '@mui/material/Avatar';
// import Button from '@mui/material/Button';
// import Tooltip from '@mui/material/Tooltip';
// import MenuItem from '@mui/material/MenuItem';
// import AdbIcon from '@mui/icons-material/Adb';
// import { useAuth } from '../../contexts/auth.contexts';
// import StoreIcon from '@mui/icons-material/Store';
// import CategoryIcon from '@mui/icons-material/Category';
// import ReceiptIcon from '@mui/icons-material/Receipt';
// import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
// import Divider from '@mui/material/Divider';

// const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

// // Define menu items array at the top level
// const menuItems = [
//   { key: 'stocks&reports', text: 'Stocks & Reports', icon: ReceiptIcon },
//   { key: 'add-sale', text: 'Add Sale', icon: CategoryIcon },
//   { key: 'add-purchase', text: 'Add Purchase', icon: StoreIcon },
//   { key: 'add-new-customer', text: 'Add New Customer', icon: PersonAddAltIcon },
// ];

// function ResponsiveAppBar() {
//   const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
//   const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

//   const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
//     setAnchorElNav(event.currentTarget);
//   };
//   const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
//     setAnchorElUser(event.currentTarget);
//   };

//   const handleCloseNavMenu = () => {
//     setAnchorElNav(null);
//   };

//   const handleCloseUserMenu = () => {
//     setAnchorElUser(null);
//   };

//   const handleMenuClick = (key: string) => {
//     console.log(key);
//   };

//   const { isAuthenticated } = useAuth();

//   if (!isAuthenticated) {
//     return null; // Don't render navbar for non-authenticated users
//   }

//   return (
//     <AppBar position="static">
//       <Container maxWidth="xl">
//         <Toolbar disableGutters>
//           <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />

//           <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
//             <IconButton
//               size="large"
//               onClick={handleOpenNavMenu}
//               color="inherit"
//             >
//               <MenuIcon />
//             </IconButton>
//             <Menu
//               id="menu-appbar"
//               anchorEl={anchorElNav}
//               anchorOrigin={{
//                 vertical: 'bottom',
//                 horizontal: 'left',
//               }}
//               keepMounted
//               transformOrigin={{
//                 vertical: 'top',
//                 horizontal: 'left',
//               }}
//               open={Boolean(anchorElNav)}
//               onClose={handleCloseNavMenu}
//               sx={{ display: { xs: 'block', md: 'none' } }}
//             >
//               {menuItems.map((item) => (
//                 <MenuItem 
//                   key={item.key} 
//                   onClick={() => {
//                     handleMenuClick(item.key);
//                     handleCloseNavMenu();
//                   }}
//                 >
//                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                     <item.icon sx={{ mr: 1 }} />
//                     <Typography>{item.text}</Typography>
//                   </Box>
//                 </MenuItem>
//               ))}
//             </Menu>
//           </Box>
//           <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
//           <Typography
//             variant="h5"
//             noWrap
//             component="a"
//             href="#app-bar-with-responsive-menu"
//             sx={{
//               mr: 2,
//               display: { xs: 'flex', md: 'none' },
//               flexGrow: 1,
//               fontFamily: 'monospace',
//               fontWeight: 700,
//               letterSpacing: '.3rem',
//               color: 'inherit',
//               textDecoration: 'none',
//             }}
//           >
//             LOGO
//           </Typography>

//           {/* Desktop Menu */}
//           <Box sx={{ 
//             flexGrow: 1, 
//             display: { xs: 'none', md: 'flex' },
//             justifyContent: 'center',
//             gap: 1
//           }}>
//             {menuItems.map((item, index) => (
//               <React.Fragment key={item.key}>
//                 <Button
//                   sx={{ 
//                     color: 'white',
//                     display: 'flex',
//                     alignItems: 'center',
//                     px: 2
//                   }}
//                   onClick={() => handleMenuClick(item.key)}
//                 >
//                   <item.icon sx={{ mr: 1 }} />
//                   {item.text}
//                 </Button>
//                 {index < menuItems.length - 1 && (
//                   <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
//                 )}
//               </React.Fragment>
//             ))}
//           </Box>

//           <Box sx={{ flexGrow: 0 }}>
//             <Tooltip title="Open settings">
//               <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
//                 <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
//               </IconButton>
//             </Tooltip>
//             <Menu
//               sx={{ mt: '45px' }}
//               id="menu-appbar"
//               anchorEl={anchorElUser}
//               anchorOrigin={{
//                 vertical: 'top',
//                 horizontal: 'right',
//               }}
//               keepMounted
//               transformOrigin={{
//                 vertical: 'top',
//                 horizontal: 'right',
//               }}
//               open={Boolean(anchorElUser)}
//               onClose={handleCloseUserMenu}
//             >
//               {settings.map((setting) => (
//                 <MenuItem key={setting} onClick={handleCloseUserMenu}>
//                   <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
//                 </MenuItem>
//               ))}
//             </Menu>
//           </Box>
//         </Toolbar>
//       </Container>
//     </AppBar>
//   );
// }
// export default ResponsiveAppBar;