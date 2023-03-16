import React, { useEffect, useRef } from 'react';
import { Box, CssBaseline, Drawer, TextField, Typography } from '@mui/material';
import styled from '@emotion/styled';

import CytoComponent from './cyto/cytoComponent';

import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

const configs = {
  drawerWidth: 340,
};

const Main = styled(Box)`
  display: flex;
  height: 100vh;
`;

const NavBar = styled(Drawer)`
  flex-shrink: 0;
`;

const NavBarContent = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  height: 100%;
  width: 100%;
  background-color: #222;
  `;
  

const SearchBox = styled(TextField)`
  margin-bottom: 16px;
`;

const CytoscapeWrapper = styled(Box)`
  flex-grow: 1;
  position: relative;
  background-color: #000;
`;

class Example extends React.Component {
  state = {
    width: 200,
    height: '100%',
  };

  // On top layout
  onResize = (event, {element, size, handle}) => {
    this.setState({width: size.width, height: size.height});
  };

  render() {
    return (
      <Resizable 
        height={this.state.height} 
        width={this.state.width} 
        onResize={this.onResize}
        axis={'x'}
        // handle={<ResizeHandle />}
      >
        <div className="box" style={{width: this.state.width + 'px' }}>
          <NavBar variant="permanent">
            <NavBarContent style={{width: this.state.width-15 + 'px' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Knowledge
              </Typography>
              <SearchBox label="Search" variant="outlined" color="primary" />
            </NavBarContent>
          </NavBar>
        </div>
      </Resizable>
    );
  }
}





function App() {

  const [drawerWidth, setDrawerWidth] = React.useState(configs.drawerWidth);

  return (
    <Main>
      <CssBaseline />
      <Example />
      <CytoscapeWrapper>
        <CytoComponent />
      </CytoscapeWrapper>
    </Main>
  );
}

export default App;
