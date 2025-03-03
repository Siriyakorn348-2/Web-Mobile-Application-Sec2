import styled from "styled-components/native"; 
import { View, Text, Image, TextInput } from "react-native"; 
import Constants from "expo-constants";

const statusBarHeight = Constants.statusBarHeight;

export const colors = {
    primary: "#F8E1E7",  
    secondary: "#EADBC8", 
    tertiary: "#BFA48A",  
    darkLight: "#D8C3A5", 
    brand: "#FAF3E0",  
    green: "#A3B18A", 
    red: "#E38B8B",
};

const { primary, secondary, tertiary, darkLight, brand, green, red } = colors;

export const Styledcontainer = styled.View`
  flex: 1;
  padding: 25px;
  padding-top: ${statusBarHeight + 10}px;
  background-color: ${primary};
`;

export const InnerContainer = styled.View`
  flex: 1;
  width: 100%;
  align-items: center;
`;

export const PageLogo = styled.Image`
  width: 250px;
  height: 200px;
`;

export const PageTitle = styled.Text`
  font-size: 30px;
  text-align: center;
  font-weight: bold;
  color: ${brand};
  padding: 10px; 
`;

export const SubTitle = styled.Text`
  font-size: 18px;
  margin-bottom: 20px;
  letter-spacing: 1px;
  font-weight: bold;
  color: ${tertiary};
`;

export const StyledFormArea = styled.View`
  width: 90%;
`;

export const StyledInput = styled.TextInput`
  background-color: ${secondary};
  padding: 15px;
  padding-left: 55px;
  padding-right: 55px; 
  border-radius: 5px;
  font-size: 16px;
  height: 60px;
  margin-vertical: 3px;
  margin-bottom: 10px;
  color: ${tertiary};
`;

export const StyledInputLabel = styled.Text`
  color: ${tertiary};
  font-size: 13px;
  text-align: left;
`;