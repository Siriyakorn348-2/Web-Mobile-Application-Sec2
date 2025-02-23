import styled from 'styled-components';
import { View, Text, Image, TouchableOpacity,TestInput } from 'react-native';
import Constants from "expo-constants";

const statusBarHeight = Constants.statusBarHeight;

export const colors = {
    primary: '#007bff',
    secondary: '#6c757d',
    tertiary: '#6c757d',
    darkLight: '#999',
    brand : '#6c757d',
    green: '#37b635',
    red: '#d73a49',
}

const { primary, secondary, tertiary, darkLight, brand, green, red } = colors;

export const Styledcontainer = styled.view`
    flex: 1;
    padding: 25px;
    padding-top: ${Constants.statusBarHeight + 10}px;
    background-color: ${primary};
`

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
    pandding: 10px;
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
    paddingr-right: 55px;
    border-radius: 5px;
    font-size: 16px;
    height: 60px;
    margin-vertical: 3px;
    margin-bottom: 10px;
    color: ${tertiary};
    `;

export const StyledInputLabel = styled.TextI`
    color: ${tertiary};
    font-size: 13px;
    text-align: left;
`;
