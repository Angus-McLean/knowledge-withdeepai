import React from 'react';
import { Drawer, TextField, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { Resizable } from 'react-resizable';

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



class SideNav extends React.Component {
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

export default SideNav;