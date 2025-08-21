import Signup from '@/components/Auth/Signup';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Sign Up Page | Base - Next.js Template',
  description: 'This is Sign Up page for Base Next.js Template',
  // other metadata
};

export default function Register() {
  return (
    <>
      <Signup />
    </>
  );
}
