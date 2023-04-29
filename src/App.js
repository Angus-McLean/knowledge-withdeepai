import React, { useEffect, useRef } from 'react';
import { Box, CssBaseline, Drawer, TextField, Typography } from '@mui/material';
import styled from '@emotion/styled';

import CytoComponent from './components/cytoComponent';
import SideNav from './components/sidebar';
import IntroModal from './components/introModal';


import 'react-resizable/css/styles.css';


const Main = styled(Box)`
  display: flex;
  height: 100vh;
`;

const configs = {
  drawerWidth: 340,
};

const CytoscapeWrapper = styled(Box)`
  flex-grow: 1;
  position: relative;
  background-color: #000;
`;




function App() {

  const [drawerWidth, setDrawerWidth] = React.useState(configs.drawerWidth);

  const [modalOpen, setModalOpen] = React.useState(true);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <Main>
      <CssBaseline />
      {/* <SideNav /> */}
      {/* <IntroModal open={modalOpen} onClose={handleCloseModal} /> */}
      <CytoscapeWrapper>
        <CytoComponent />
      </CytoscapeWrapper>
    </Main>
  );
}

export default App;
