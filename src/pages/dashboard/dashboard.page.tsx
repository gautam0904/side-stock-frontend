import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Button, CircularProgress } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningIcon from '@mui/icons-material/Warning';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useNavigate } from 'react-router-dom';
import { BarChart, PieChart } from '@mui/x-charts';
import { productService } from '../../api/product.service';
import { GstContext } from '../../contexts/gst.contexts';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StoreIcon from '@mui/icons-material/Store';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import EmojiSymbolsIcon from '@mui/icons-material/EmojiSymbols';
import HomeIcon from '@mui/icons-material/Home';
import BorderClearIcon from '@mui/icons-material/BorderClear';
import ApartmentIcon from '@mui/icons-material/Apartment';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isNonGST } = React.useContext(GstContext);
  const [loading, setLoading] = useState(true);
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    rentedItems: 0,
    lowStock: 0,
    lostItems: 0,
    totalItems: 0,
    totalStock: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await productService.getAllProducts({ limit: 100 });
        const products = response.data.products;

        // Calculate total quantities
        const totalStock = products.reduce((sum: any, p: any) => sum + p.stock, 0);
        const totalRented = products.reduce((sum: any, p: any) => sum + p.rented, 0);
        const totalLoss = products.reduce((sum: any, p: any) => sum + p.loss, 0);
        const totalItems = products.reduce((sum: any, p: any) => Number(sum) + Number(p.totalStock), 0);

        // Calculate statistics
        const stats = {
          totalProducts: products.length,
          rentedItems: totalRented,
          lowStock: products.filter((p: any) => p.stock < 10).length,
          lostItems: totalLoss,
          totalItems: totalItems,
          totalStock,
        };
        setProductStats(stats);

        // Prepare chart data (top 5 products by total quantity - stock + rented)
        const topProducts = products
          .sort((a: any, b: any) => (b.stock + b.rented) - (a.stock + a.rented))
          .slice(0, 5)
          .map((p: any) => ({
            product: `${p.productName}\n(${p.size})`, // Adding line break for readability
            stock: p.stock,
            rented: p.rented
          }));
        setChartData(topProducts);

        // Calculate pie chart data
        const pieData = [
          { id: 0, value: totalStock, label: 'In Stock', color: '#7b4eff' },
          { id: 1, value: totalRented, label: 'Rented', color: '#4CAF50' },
          { id: 2, value: totalLoss, label: 'Lost', color: '#f44336' }
        ];
        setPieChartData(pieData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statsCards = [
    { 
      title: 'Total products', 
      value: productStats.totalItems,
      subtitle: 'Total of all items',
      icon: InventoryIcon, 
      color: '#37a1b0', 
      bgColor: '#30d6ed3b' 
    },
    { 
      title: 'Rented Items', 
      value: productStats.rentedItems,
      subtitle: 'Currently Rented',
      icon: ShoppingCartIcon, 
      color: '#67cb6f', 
      bgColor: '#67cb6f63' 
    },
    { 
      title: 'Lost Items', 
      value: productStats.lostItems,
      subtitle: 'Total Losses',
      icon: TimelineIcon, 
      color: '#f44336', 
      bgColor: '#ffebee' 
    },
    { 
      title: 'Stock Product', 
      value: productStats.totalStock,
      subtitle: 'Total Stock',
      icon: ApartmentIcon, 
      color: '#17500b', 
      bgColor: '#bdff4054' 
    }, 
    { 
      title: 'Low Stock', 
      value: productStats.lowStock,
      subtitle: 'Less than 10 items',
      icon: WarningIcon, 
      color: '#ff9800', 
      bgColor: '#fff3e0' 
    },
    { 
      title: 'Types of products', 
      value: productStats.totalProducts, 
      subtitle: 'Unique products',
      icon: BorderClearIcon, 
      color: '#7b4eff', 
      bgColor: '#9c68ff57' 
    },
  ];

  // Ensure each menu item has a unique icon
  const gstMenuItems = [
    { key: 'home', text: 'Home', icon: HomeIcon, path: '/dashboard'},
    { key: 'stocks&reports', text: 'Stocks & Reports', icon: AutoStoriesIcon, path: '/stocks' },
    { key: 'add-sale', text: 'Add Sale', icon: PointOfSaleIcon, path: '/sales/new' },
    { key: 'add-purchase', text: 'Add Purchase', icon: DashboardCustomizeIcon, path: '/purchasesGST/new' },
    { key: 'add-new-customer', text: 'Add New Customer', icon: EmojiSymbolsIcon, path: '/customersGST/new' },
  ];

  const nonGstMenuItems = [
    { key: 'stocks&price', text: 'Stocks & Price', icon: ReceiptIcon, path: '/stocks' },
    { key: 'challan', text: 'Challan', icon: StoreIcon, path: '/challan' },
    { key: 'payment', text: 'Payment', icon: CurrencyRupeeIcon, path: '/payment' },
    { key: 'direct-bill', text: 'Direct Bill', icon: CurrencyBitcoinIcon, path: '/bill/new' },
    { key: 'customer-new', text: 'Add Customer', icon: PersonAddAltIcon, path: '/customerNonGST/new' },
  ];

  // Added more unique icons to avoid repetition
  const additionalMenuItems = [
    { key: 'product-management', text: 'Product Management', icon: ProductionQuantityLimitsIcon, path: '/products' },
    { key: 'payment-history', text: 'Payment History', icon: AttachMoneyIcon, path: '/payment/history' },  // Unique Icon
  ];

  const menuItems = [...nonGstMenuItems, ...gstMenuItems, ...additionalMenuItems];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#7b4eff' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, mt: 8, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        {statsCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Paper
              elevation={3} // Improved shadow effect
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 3,
                bgcolor: card.bgColor,
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-10px)',  // Improved hover effect
                  boxShadow: '0 6px 25px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {card.value}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {card.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {card.subtitle}
                </Typography>
              </Box>
              <card.icon sx={{ fontSize: 50, color: card.color }} /> {/* Adjusted icon size */}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Navigation Buttons */}
      <Grid container spacing={2} mb={3}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.key}>
            <Button
              fullWidth
              sx={{
                bgcolor: '#7b4eff',
                color: 'white',
                p: 2,
                borderRadius: 3,
                boxShadow: '0 4px 14px rgba(123,78,255,0.2)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: '#6a3dd9',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(123,78,255,0.3)',
                }
              }}
              onClick={() => navigate(item.path)}
            >
              <item.icon sx={{ mr: 1, fontSize: 24 }} />
              <Typography sx={{ fontWeight: 500 }}>{item.text}</Typography>
            </Button>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white' }}>
            <Typography variant="h6" mb={3} sx={{ fontWeight: 600 }}>Top 5 Products - Stock vs Rented</Typography>
            <BarChart
              series={[
                { 
                  data: chartData.map(item => item.stock), 
                  label: 'Stock', 
                  color: '#7b4eff',
                  valueFormatter: (value) => `${value} items`
                },
                { 
                  data: chartData.map(item => item.rented), 
                  label: 'Rented', 
                  color: '#4CAF50',
                  valueFormatter: (value) => `${value} items`
                }
              ]}
              xAxis={[{ 
                data: chartData.map(item => item.product),
                scaleType: 'band',
                tickLabelStyle: { 
                  textAnchor: 'start',
                  accentColor: '#7b4eff'
                }
              }]}
              height={350}
              sx={{
                '.MuiChartsAxis-tickLabel': { fontSize: '0.875rem' },
                '.MuiChartsAxis-label': { fontSize: '1rem' }
              }}
              tooltip={{ trigger: 'item' }}
              legend={{
                hidden: false,
                position: { vertical: 'top', horizontal: 'left' },
                padding: 20,
              }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white' }}>
            <Typography variant="h6" mb={3} sx={{ fontWeight: 600 }}>Overall Distribution</Typography>
            <PieChart
              series={[
                {
                  data: pieChartData,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30 },
                  valueFormatter: (value) => {
                    const total = Number(productStats.totalProducts) + Number(productStats.rentedItems) + Number(productStats.lostItems);
                    return `${value.value} items (${((Number(value.value) / total) * 100).toFixed(1)}%)`;
                  }
                }
              ]}
              height={300}
              tooltip={{ trigger: 'item' }}
              legend={{
                hidden: false,
                position: { vertical: 'bottom', horizontal: 'right' }
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;