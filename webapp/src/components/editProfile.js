import React, { useState, useEffect } from 'react';
import { TextField, Button, Avatar, Typography, Paper } from '@mui/material';
import { getAuth, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import '../css/editProfile.css';

const EditProfile = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const storage = getStorage();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
    setPhotoURL(user?.photoURL || '');
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    const storageRef = ref(storage, `profile_images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSave = async () => {
    try {
      let updatedPhotoURL = photoURL;

      if (imageFile) {
        updatedPhotoURL = await uploadImage(imageFile);
      }

      await updateProfile(user, {
        displayName: displayName,
        photoURL: updatedPhotoURL
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
          <Avatar src={imagePreview || photoURL} alt={displayName} className="profile-avatar" />
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

          {imagePreview && (
            <div className="image-preview-container">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="image-preview" 
              />
            </div>
          )}

          <div className="upload-container">
            <input 
              type="file" 
              accept="image/*" 
              id="file-upload" 
              className="custom-file-input" 
              onChange={handleImageChange} 
            />
            <label htmlFor="file-upload" className="custom-file-label">
              Choose a new image
            </label>
          </div>

          <Button variant="contained" color="primary" className="save-button" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </Paper>
    </div>
  );
};

export default EditProfile;
