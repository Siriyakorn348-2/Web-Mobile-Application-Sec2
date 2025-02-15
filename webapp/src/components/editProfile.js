import React, { useState, useEffect } from 'react';
import { TextField, Button, Avatar, Typography, Paper } from '@mui/material';
import { getAuth, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom'; 
import '../css/editProfile.css';

const EditProfile = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate(); 

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
    setPhotoURL(user?.photoURL || '');
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL
      });
      console.log('Profile updated successfully!');
      
      navigate('/home'); 
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="edit-profile-container">
      <Paper className="profile-paper">
        <div className="profile-header">
          <Avatar src={photoURL} alt={displayName} className="profile-avatar" />
          <Typography variant="h5" className="profile-name">{displayName}</Typography>
        </div>
        <div className="profile-info">
          <TextField
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            className="input-field"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            className="input-field"
            disabled
          />
          <TextField
            label="Profile Picture URL"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            className="input-field"
          />
          <Button variant="contained" color="primary" className="save-button" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </Paper>
    </div>
  );
};

export default EditProfile;
