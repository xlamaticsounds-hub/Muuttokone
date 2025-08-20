import Signin from "@/components/Auth/Signin";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Sign In Page | Base - Next.js Template",
  description: "This is Sign In page for Base Next.js Template",
  // other metadata
};

const SigninPage = () => {
  return (
    <>
      <Signin />
    </>
  );
};

export default SigninPage;
