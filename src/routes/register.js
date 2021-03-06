import React from "react";
import Helmet from "react-helmet-async";
import { RegistrationForm } from "../components/registerForm";
import { useLogoutUser } from "../lib/hooks";

const RegisterPage = () => {
  const { logoutUser } = useLogoutUser();
  return (
    <React.Fragment>
      <Helmet>
        <title>Register Page</title>
      </Helmet>
      <div
        css={tw`flex flex-wrap justify-center content-center min-h-screen border-0 -mt-8`}
      >
        <RegistrationForm />
      </div>
    </React.Fragment>
  );
};

export default RegisterPage;
