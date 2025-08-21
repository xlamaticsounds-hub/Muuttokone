import Signin from '@/components/Auth/Signin';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Kirjaudu sisään | Muuttokone.fi',
  description: 'Kirjaudu sisään Muuttokone.fi palveluun',
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
