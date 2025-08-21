'use client';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import SlideOnReveal from '@/components/SlideOnReveal';
import { integrations, messages } from '../../../integrations.config';
import z from 'zod';

const schema = z.object({
  password: z
    .string()
    .min(8)
    .refine(
      (val) =>
        /[A-Z]/.test(val) && // At least one uppercase letter
        /[a-z]/.test(val) && // At least one lowercase letter
        /\d/.test(val) && // At least one number
        /[@$!%*?&]/.test(val), // At least one special character
      {
        message:
          'Password must be at least 8 characters long and contain uppercase and lowercase letters, a number, and a special character.',
      },
    ),
});

const ResetPassword = ({ token }: { token: string }) => {
  const [data, setData] = useState({
    password: '',
  });
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [user, setUser] = useState({
    email: '',
  });

  // Suppress unused variable warnings for future use
  void setError;
  void verified;

  const router = useRouter();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.post(`/api/forget-password/verify-token`, {
          token,
        });

        if (res.status === 200) {
          setUser({
            email: res.data.email,
          });
          setVerified(true);
        }
      } catch (error) {
        // @ts-ignore
        toast.error(error.response.data);
        router.push('/auth/forget-password');
      }
    };

    if (integrations?.isAuthEnabled) {
      verifyToken();
    }
  }, [token, router]);

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
      const res = await axios.post(`/api/forget-password/update`, {
        email: user?.email,
        password: data.password,
      });

      if (res.status === 200) {
        toast.success(res.data);
        setVerified(true);
        setData({ password: '' });
        router.push('/auth/signin');
      }
    } catch (error) {
      // @ts-ignore
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
                Update Password
              </h3>

              <p>Enter your new password</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <label
                  htmlFor="password"
                  className="text-dark mb-3 block text-sm font-medium dark:text-white"
                >
                  Your Password
                </label>
                <input
                  type="text"
                  placeholder="Password"
                  name="password"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  required
                  className={`border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-4 dark:border-stroke dark:focus:border-primary/40 w-full rounded-full border bg-white px-6 py-3.5 focus-visible:outline-hidden dark:bg-black dark:shadow-none`}
                />
              </div>

              <button
                aria-label="login with email and password"
                className={`bg-primary hover:shadow-1 block w-full rounded-full px-7.5 py-3 text-center font-medium text-white duration-300 ease-in-out ${
                  error.length > 0 || !data.password ? 'bg-gray-600' : 'bg-black'
                }`}
                type="submit"
              >
                Save Password
                <svg
                  className="fill-white"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
                    fill=""
                  />
                </svg>
              </button>

              {error.length > 0 && <p className="text-red-500">{error}</p>}
            </form>
          </div>
        </SlideOnReveal>
      </section>
      {/* <!-- ===== SignIn Form End ===== --> */}
    </>
  );
};

export default ResetPassword;
