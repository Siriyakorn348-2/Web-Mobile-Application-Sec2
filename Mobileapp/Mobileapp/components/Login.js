import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, Button } from "react-native";
import { Formik } from "formik";
import {
  Styledcontainer,
  InnerContainer,
  PageTitle,
  SubTitle,
  StyledFormArea,
  StyledInput,
  StyledInputLabel,
} from "../assets/test";

const Login = () => {
  return (
    <Styledcontainer>
      <StatusBar style="dark" />
      <InnerContainer>
        <PageTitle>MobileApplication</PageTitle>
        <SubTitle>Account Login</SubTitle>
        <Formik
          initialValues={{ email: "", password: "" }}
          onSubmit={(values) => {
            console.log(values);
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values }) => (
            <StyledFormArea>
              <MyTextInput
                label="Email Address"
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                value={values.email}
              />
              <MyTextInput
                label="Password"
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
                secureTextEntry
              />
              <Button title="Login" onPress={handleSubmit} />
            </StyledFormArea>
          )}
        </Formik>
      </InnerContainer>
    </Styledcontainer>
  );
};

const MyTextInput = ({ label, ...props }) => {
  return (
    <View>
      <StyledInputLabel>{label}</StyledInputLabel>
      <StyledInput {...props} />
    </View>
  );
};

export default Login;