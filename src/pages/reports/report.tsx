import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxTissue,
  faCubes,
  faLayerGroup,
  faMoneyBillTransfer,
  faMoneyCheckDollar,
  faPersonMilitaryPointing,
  faSackDollar,
  faSkullCrossbones,
  faHome,
} from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  Grid,
  Typography,
  useTheme,
  Box,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { CSSTransition } from 'react-transition-group';
import './report.css';

interface MenuItem {
  key: string;
  text: string;
  icon: any;
  color: string;
}

const menuItems: MenuItem[] = [
  { key: 'outsatanding', text: 'Outstanding Report', icon: faSackDollar, color: '#6C5B7B' },
  { key: 'rentmemo', text: 'Rent Memo Report', icon: faMoneyBillTransfer, color: '#4ecdad' },
  { key: 'issue-item', text: 'Issue Item Report', icon: faLayerGroup, color: '#FF9A8B' },
  { key: 'statement', text: 'Statement Report', icon: faMoneyCheckDollar, color: '#45B7D1' },
  { key: 'party', text: 'Party Report', icon: faPersonMilitaryPointing, color: '#2db576' },
  { key: 'issueItem', text: 'Issued Item Report', icon: faBoxTissue, color: '#FFD700' },
  { key: 'customerStock', text: 'Customer Stock Report', icon: faCubes, color: '#A283C4' },
  { key: 'damage', text: 'Damage Report', icon: faSkullCrossbones, color: '#FF6B6B' },
];

const getGradient = (baseColor: string) => {
  const darkerMap = {
    '#FF6B6B': '#FF4757',
    '#4ecdad': '#3DA89F',
    '#45B7D1': '#3295AD',
    '#2db576': '#7EBA9A',
    '#FFD700': '#FFC000',
    '#A283C4': '#8E6BB8',
    '#FF9A8B': '#FF8474',
    '#6C5B7B': '#594769',
  };
  return `linear-gradient(135deg, ${baseColor} 0%, ${darkerMap[baseColor as keyof typeof darkerMap]} 100%)`;
};

const Report: React.FC = () => {
  const theme = useTheme();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleButtonClick = (reportKey: string) => {
    setSelectedReport(reportKey);
  };

  const handleBack = () => {
    setSelectedReport(null);
  };

  const renderReportContent = () => {
    if (!selectedReport) return null;
    const report = menuItems.find(item => item.key === selectedReport);
    if (!report) return null;

    return (
      <Typography variant="body1" sx={{ lineHeight: 1.6, color: theme.palette.text.secondary }}>
        <strong style={{ color: report.color }}>{report.text}:</strong> Detailed content for the <em>{report.text}</em> report goes here.
      </Typography>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {!selectedReport && (
        <Grid container spacing={3}>
          {menuItems.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.key}>
              <Button
                fullWidth
                sx={{
                  minHeight: 140,
                  background: getGradient(item.color),
                  color: theme.palette.getContrastText(item.color),
                  p: 3,
                  borderRadius: 4,
                  boxShadow: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                    background: getGradient(item.color),
                    opacity: 0.9
                  },
                }}
                onClick={() => handleButtonClick(item.key)}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  size="2x"
                  style={{
                    marginBottom: 16,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    letterSpacing: 0.5,
                    textShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  {item.text}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      )}

      <CSSTransition
        in={!!selectedReport}
        timeout={300}
        classNames="slide"
        unmountOnExit
      >
        <Box
          sx={{
            mt: 2,
            p: 3,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 4,
            boxShadow: 4,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{
              mb: 3,
              '& .MuiBreadcrumbs-separator': { mx: 1.5 },
              '& .MuiBreadcrumbs-li': { display: 'flex', alignItems: 'center' }
            }}
          >
            <Link
              onClick={handleBack}
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: theme.palette.text.secondary,
                transition: 'all 0.2s',
                '&:hover': {
                  color: theme.palette.primary.main,
                  transform: 'translateX(-2px)'
                }
              }}
            >
              <FontAwesomeIcon icon={faHome} style={{ marginRight: 8, fontSize: '0.9rem' }} />
              Reports
            </Link>
            <Typography
              variant="subtitle1"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FontAwesomeIcon
                icon={menuItems.find(i => i.key === selectedReport)?.icon}
                style={{
                  marginRight: 12,
                  color: menuItems.find(i => i.key === selectedReport)?.color,
                  fontSize: '1.1rem'
                }}
              />
              {selectedReport}
            </Typography>
          </Breadcrumbs>

          <Box sx={{
            mb: 4,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.divider,
              borderRadius: 3
            }
          }}>
            <Box sx={{
              display: 'flex',
              gap: 2,
              minWidth: 'fit-content',
              pb: 1
            }}>
              {menuItems.map((item) => (
                <Button
                  key={item.key}
                  variant="outlined"
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    borderWidth: 2,
                    fontSize: '12px',
                    borderColor: item.key === selectedReport ? item.color : theme.palette.divider,
                    backgroundColor: item.key === selectedReport ? `${item.color}15` : 'transparent',
                    color: item.key === selectedReport ? item.color : theme.palette.text.secondary,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: item.color,
                      backgroundColor: `${item.color}25`,
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleButtonClick(item.key)}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    style={{
                      marginRight: 12,
                      fontSize: '12px'
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600  ,fontSize: '12px'}}>
                    {item.text}
                  </Typography>
                </Button>
              ))}
            </Box>
          </Box>

          <CSSTransition
            key={selectedReport}
            in={!!selectedReport}
            timeout={300}
            classNames="fade"
            unmountOnExit
          >
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: theme.palette.background.default,
                borderLeft: `4px solid ${menuItems.find(i => i.key === selectedReport)?.color}`,
                boxShadow: theme.shadows[2]
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: menuItems.find(i => i.key === selectedReport)?.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontWeight: 700
                }}
              >
                <FontAwesomeIcon
                  icon={menuItems.find(i => i.key === selectedReport)?.icon}
                />
                {menuItems.find(i => i.key === selectedReport)?.text}
              </Typography>
              {renderReportContent()}
            </Box>
          </CSSTransition>
        </Box>
      </CSSTransition>
    </Box>
  );
};

export default Report;