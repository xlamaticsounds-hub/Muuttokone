import Signup from '@/components/Auth/Signup';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Luo tili | Muuttokone.fi',
  description: 'Luo uusi käyttäjätili Muuttokone.fi palveluun',
  // other metadata
};

export default function Register() {
  return (
    <>
      <Signup />
    </>
  );
}
