'use client';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import Graphics from '@/components/Auth/Graphics';
import SlideOnReveal from '@/components/SlideOnReveal';
import z from 'zod';
import { integrations, messages } from '../../../integrations.config';

const schema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

const ForgetPassword = () => {
  const [data, setData] = useState({
    email: '',
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!integrations.isAuthEnabled) {
      toast.error(messages.auth);
      return;
    }

    const result = schema.safeParse(data);

    if (!result.success) {
      result.error.errors.forEach((error) => {
        toast.error(error.message);
      });
      return;
    }

    try {
      const res = await axios.post('/api/forget-password/reset', data);

      if (res.status === 404) {
        toast.error('User not found.');
        return;
      }

      if (res.status === 200) {
        toast.success(res.data);
        setData({ email: '' });
      }

      setData({ email: '' });
    } catch (error: any) {
      console.log(error);
      toast.error(error.response.data);
    }
  };

  return (
    <>
      {/* <!-- ===== SignIn Form Start ===== --> */}
      <section className="bg-whiter dark:bg-blacksection relative overflow-hidden px-4 pt-35 pb-20 md:px-8 lg:pt-45 lg:pb-25 xl:px-0 xl:pt-50 xl:pb-30">
        <SlideOnReveal delay={0.3}>
          <div className="animate_top shadow-3 relative z-10 mx-auto max-w-550 rounded-lg bg-white px-7.5 py-9 md:px-12.5 md:py-11.5 lg:px-17.5 lg:py-16.5 dark:bg-black dark:shadow-none">
            <span className="bg-primary absolute top-0 left-0 block h-1.5 w-1/2 rounded-tl-lg"></span>
            <span className="bg-secondary absolute top-0 right-0 block h-1.5 w-1/2 rounded-tr-lg"></span>

            <div className="mb-9 text-center">
              <h3 className="text-title-lg2 mb-2.5 font-medium text-black dark:text-white">
                Forgot Password
              </h3>

              <p>
                Enter the email address associated with your account and we&#39;ll send you a link
                to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <input
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-4 dark:border-stroke dark:focus:border-primary/40 w-full rounded-full border bg-white px-6 py-3.5 focus-visible:outline-hidden dark:bg-black dark:shadow-none"
                />
              </div>

              <button
                aria-label="reset password"
                className="bg-primary hover:shadow-1 block w-full rounded-full px-7.5 py-3 text-center font-medium text-white duration-300 ease-in-out"
                type="submit"
              >
                Send Reset Link
              </button>
            </form>
          </div>
        </SlideOnReveal>
        <Graphics />
      </section>
      {/* <!-- ===== SignIn Form End ===== --> */}
    </>
  );
};

export default ForgetPassword;
