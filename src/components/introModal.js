import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const IntroModal = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Welcome</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Hello and welcome to the Knowledge Tree
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Get Started
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IntroModal;
