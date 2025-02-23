import React from "react";
import { StatusBar} from "expo-status-bar";

import { View } from "react-native";
import { Formik } from "formik";
import { Styledcontainer, InnerContainer, PageLogo, PageTitle, SubTitle,StyledFormArea } from "../components/test";

const Login = () => {
    return (
        <Styledcontainer>
            <StatusBar style="Dark" />
            <InnerContainer>
                <PageLogo resizeMode="cover" source={require('../assets/img/expo-bg.png')} />
                <PageTitle>MobileApp</PageTitle>
                <SubTitle>Account Login</SubTitle>

                <Formik
                    initialValues={{email: "", password: ""}}
                    onSubmit={(values) => {
                        console.log(values);
                    }}
                >
                    {({handleChange, handleBlur, handleSubmit, values}) => <StyledFormArea> </StyledFormArea>}
                </Formik>
            </InnerContainer>
        </Styledcontainer>
    );
}

const MyTextInput = (label, icon, props) => {
    return (
        <View>
            <StyledInputLabel>{label}</StyledInputLabel>
        </View>
    );
}
export default Login;